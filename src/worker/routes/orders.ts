import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import {
  createOrder,
  getOrderByIdAndStore,
  getOrdersByUserAndStore,
  getOrderItemsByOrderAndStore,
  updateOrderPayment,
} from "../core/database.js";
import type { CartItemPayload } from "../core/schema.js";
import { Variables } from "../types.js";
import { createPaymentPIX } from "../services/mercadopago.js";

const orders = new Hono<{ Bindings: Env; Variables: Variables }>();

orders.use("*", authMiddleware);

/**
 * Cria pedido com itens do carrinho (store_id + user_id).
 */
orders.post("/", async (c) => {
  const user = c.get("user") as { id: string };
  const store = c.get("store");
  const body = (await c.req.json()) as { items?: CartItemPayload[] };

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return c.json({ success: false, error: "Items array is required" }, 400);
  }

  try {
    const { orderId, total } = await createOrder(c.env, {
      storeId: store.id,
      userId: user.id,
      items: body.items,
    });
    return c.json(
      { success: true, data: { orderId, status: "pending", total } },
      201
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Falha ao criar pedido";
    console.error("Order creation error:", err);
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * Registra método de pagamento. Para PIX, chama a API do Mercado Pago e retorna QR Code e Copia e Cola.
 */
orders.post("/:id/payment", async (c) => {
  const user = c.get("user") as { id: string; email?: string; google_user_data?: { email?: string } };
  const store = c.get("store");
  const orderId = c.req.param("id");
  const body = (await c.req.json()) as { payment_method?: string };

  if (!body.payment_method) {
    return c.json({ success: false, error: "Payment method required" }, 400);
  }

  const order = await getOrderByIdAndStore(c.env, orderId, user.id, store.id);
  if (!order) {
    return c.json({ success: false, error: "Pedido não encontrado" }, 404);
  }

  const token = c.env.MERCADO_PAGO_ACCESS_TOKEN;
  const payerEmail = user.google_user_data?.email ?? user.email ?? "comprador@email.com";

  if (body.payment_method === "pix" && token) {
    try {
      const idempotencyKey = crypto.randomUUID();
      const baseUrl = (c.env as { NOTIFICATION_BASE_URL?: string }).NOTIFICATION_BASE_URL;
      const notificationUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/api/webhooks/mercadopago` : undefined;

      const pix = await createPaymentPIX(token, {
        orderId: Number(orderId),
        total: order.total,
        payerEmail,
        idempotencyKey,
        notificationUrl,
      });

      await updateOrderPayment(c.env, orderId, store.id, "pix", {
        paymentId: pix.paymentId,
        paymentStatus: "pending",
      });

      return c.json({
        success: true,
        data: {
          orderId: Number(orderId),
          pixCode: pix.copyPaste,
          qrCodeBase64: pix.qrCodeBase64,
          copyPaste: pix.copyPaste,
          payment_method: "pix",
          status: pix.status,
        },
      }, 200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Falha ao gerar PIX no Mercado Pago";
      console.error("Mercado Pago PIX error:", err);
      return c.json({ success: false, error: message }, 500);
    }
  }

  try {
    await updateOrderPayment(c.env, orderId, store.id, body.payment_method);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Incapaz de registrar o método de pagamento";
    return c.json({ success: false, error: message }, 500);
  }

  let ticketUrl: string | null = null;
  let initPoint: string | null = null;
  if (body.payment_method === "boleto") {
    ticketUrl = "https://www.mercadopago.com.br/sandbox/payments/ticket";
  } else if (body.payment_method === "credit_card") {
    initPoint = "https://www.mercadopago.com.br/checkout/v1/redirect";
  }

  return c.json({
    success: true,
    data: {
      payment_method: body.payment_method,
      status: "pending",
      ticket_url: ticketUrl,
      init_point: initPoint,
    },
  }, 200);
});

/**
 * Histórico de pedidos do usuário na loja.
 */
orders.get("/", async (c) => {
  const user = c.get("user") as { id: string };
  const store = c.get("store");

  try {
    const data = await getOrdersByUserAndStore(c.env, user.id, store.id);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao buscar pedidos";
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * Detalhe de um pedido com itens.
 */
orders.get("/:id", async (c) => {
  const user = c.get("user") as { id: string };
  const store = c.get("store");
  const orderId = c.req.param("id");

  const order = await getOrderByIdAndStore(c.env, orderId, user.id, store.id);
  if (!order) {
    return c.json({ success: false, error: "Pedido não encontrado" }, 404);
  }

  try {
    const items = await getOrderItemsByOrderAndStore(c.env, orderId, store.id);
    return c.json({ success: true, data: { ...order, items } }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao buscar itens do pedido";
    return c.json({ success: false, error: message }, 500);
  }
});

export default orders;
