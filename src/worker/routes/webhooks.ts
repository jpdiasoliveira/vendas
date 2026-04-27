import { Hono } from "hono";
import { Variables } from "../types.js";
import { getPayment } from "../services/mercadopago.js";
import { applyMercadoPagoPaymentSnapshotToOrder } from "../services/mercadopagoOrderPaymentReconcile.js";
import { isRequireMpWebhookSecret } from "../core/config.js";
import { verifyMercadoPagoWebhookSignature } from "../utils/mercadopagoWebhookSignature.js";

const webhooks = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Webhook do Mercado Pago (IPN).
 * Recebe a notificação, busca o status do pagamento na API e, se aprovado, atualiza o pedido.
 */
webhooks.post("/mercadopago", async (c) => {
  try {
    const body = (await c.req.json()) as { type?: string; data?: { id?: string } };
    console.log("[Webhook MP] Received:", JSON.stringify({ type: body.type, dataId: body.data?.id }));

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
    console.log("[Webhook MP] Payment status:", payment.id, payment.status, payment.external_reference);

    const orderId = payment.external_reference;
    if (!orderId) {
      console.warn("[Webhook MP] No external_reference in payment:", paymentId);
      return c.json({ success: true, data: { received: true } }, 200);
    }

    const applied = await applyMercadoPagoPaymentSnapshotToOrder(c.env, {
      orderId,
      payment,
    });

    if (applied.kind === "approval") {
      const { outcome } = applied;
      if (outcome === "paid") {
        console.log("[Webhook MP] Order updated to paid:", orderId);
      } else if (outcome === "idempotent_skip") {
        console.log("[Webhook MP] Idempotente (notificação repetida), sem nova baixa:", orderId);
      } else if (outcome === "payment_id_conflict") {
        console.warn("[Webhook MP] Conflito payment_id vs pedido já pago — revisar manualmente:", orderId);
      } else if (outcome === "stock_conflict_cancelled") {
        console.warn(
          "[Webhook MP] Pedido cancelado por estoque insuficiente após aprovação no MP (estorno manual):",
          orderId
        );
      }
    } else if (applied.kind === "cancelled") {
      console.log("[Webhook MP] Order cancelled (status from MP):", payment.status, orderId);
    } else if (applied.reason === "pending_like") {
      console.log("[Webhook MP] Aguardando confirmação (status MP):", payment.status, orderId);
    } else if (applied.reason === "reference_mismatch") {
      console.warn("[Webhook MP] external_reference não bate com pedido; ignorado:", orderId, payment.id);
    } else {
      console.log("[Webhook MP] Payment status (no action):", payment.status);
    }

    return c.json({ success: true, data: { received: true } }, 200);
  } catch (err: unknown) {
    console.error("[Webhook MP] Error:", err);
    return c.json({ success: false, error: "Erro ao processar notificação" }, 500);
  }
});

export default webhooks;
