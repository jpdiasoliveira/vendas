import { Hono } from "hono";
import { Variables } from "../types.js";
import { getPayment } from "../services/mercadopago.js";
import { applyMercadoPagoPaymentSnapshotToOrder } from "../services/mercadopagoOrderPaymentReconcile.js";
import { getOrderById } from "../core/database.js";
import { isRequireMpWebhookSecret } from "../core/config.js";
import { logAuditEvent } from "../utils/audit.js";
import { logServerError } from "../utils/safeApiError.js";
import { verifyMercadoPagoWebhookSignature } from "../utils/mercadopagoWebhookSignature.js";

const webhooks = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Webhook do Mercado Pago (IPN).
 * Valida assinatura, consulta GET /v1/payments/:id e reconcilia o pedido (mesma tranca que o admin).
 */
webhooks.post("/mercadopago", async (c) => {
  try {
    const body = (await c.req.json()) as { type?: string; data?: { id?: string } };

    const paymentIdStr = body.data?.id;
    const dataIdForSignature =
      paymentIdStr ?? new URL(c.req.url).searchParams.get("data.id") ?? undefined;

    const strict = isRequireMpWebhookSecret(c.env);
    const sigCheck = await verifyMercadoPagoWebhookSignature(
      c.env,
      c.req.raw.headers,
      c.req.url,
      dataIdForSignature,
      { requireSecretAndSignature: strict }
    );
    if (!sigCheck.ok) {
      console.warn("[Webhook MP] Recusa (assinatura / política):", sigCheck.reason, { strict });
      return c.json({ success: false, error: "Não autorizado" }, 403);
    }
    if (!paymentIdStr) {
      console.warn("[Webhook MP] Missing data.id");
      return c.json({ success: true, data: { received: true } }, 200);
    }

    const paymentId = Number(paymentIdStr);
    if (Number.isNaN(paymentId)) {
      console.warn("[Webhook MP] Invalid data.id:", paymentIdStr);
      return c.json({ success: true, data: { received: true } }, 200);
    }

    const token = c.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) {
      console.error("[Webhook MP] MERCADO_PAGO_ACCESS_TOKEN not set");
      return c.json({ success: false, error: "Server config error" }, 500);
    }

    const payment = await getPayment(token, paymentId);

    const orderId = payment.external_reference;
    if (!orderId) {
      console.warn("[Webhook MP] No external_reference in payment:", paymentId);
      return c.json({ success: true, data: { received: true } }, 200);
    }

    const applied = await applyMercadoPagoPaymentSnapshotToOrder(c.env, {
      orderId,
      payment,
    });

    const orderRow = await getOrderById(c.env, String(orderId).trim());
    if (orderRow) {
      const details: Record<string, unknown> = {
        actor: "mercadopago_ipn",
        mp_payment_id: payment.id,
        mp_status: payment.status,
        reconcile_kind: applied.kind,
      };
      if (applied.kind === "approval") {
        details.approval_outcome = applied.outcome;
        if (applied.outcome === "payment_id_conflict" || applied.outcome === "stock_conflict_cancelled") {
          logServerError("webhooks.mercadopago.payment_anomaly", details);
        }
      } else if (applied.kind === "ignored") {
        details.ignored_reason = applied.reason;
      }
      await logAuditEvent(c.env, {
        storeId: orderRow.storeId,
        userId: null,
        action: "MP_WEBHOOK_PAYMENT_NOTIFICATION",
        resourceType: "order",
        resourceId: String(orderId).trim(),
        details,
      });
    }

    return c.json({ success: true, data: { received: true } }, 200);
  } catch (err: unknown) {
    logServerError("webhooks.mercadopago", err);
    return c.json({ success: false, error: "Erro ao processar notificação" }, 500);
  }
});

export default webhooks;
