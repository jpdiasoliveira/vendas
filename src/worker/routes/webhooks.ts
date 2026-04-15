import { Hono } from "hono";
import { Variables } from "../types.js";
import { getPayment } from "../services/mercadopago.js";
import { updateOrderPaymentStatus, updateOrderStatus, getOrderById } from "../core/database.js";
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
    const sigCheck = await verifyMercadoPagoWebhookSignature(
      c.env,
      c.req.raw.headers,
      c.req.url,
      paymentIdStr ?? new URL(c.req.url).searchParams.get("data.id")
    );
    if (!sigCheck.ok) {
      console.warn("[Webhook MP] Assinatura inválida:", sigCheck.reason);
      return c.json({ success: false, error: "Não autorizado" }, 401);
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

    if (payment.status === "approved") {
      await updateOrderPaymentStatus(c.env, orderId, "approved", { paymentId: payment.id });
      console.log("[Webhook MP] Order updated to paid:", orderId);
    } else if (
      payment.status === "rejected" ||
      payment.status === "cancelled" ||
      payment.status === "refunded"
    ) {
      const order = await getOrderById(c.env, orderId);
      if (order) {
        await updateOrderStatus(c.env, orderId, order.storeId, "cancelled");
        console.log("[Webhook MP] Order cancelled (status from MP):", payment.status, orderId);
      } else {
        console.warn("[Webhook MP] Order not found for cancel/refund:", orderId);
      }
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
