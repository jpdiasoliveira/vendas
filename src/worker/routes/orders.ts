import { Hono } from "hono";
import { verifyCustomerAuth } from "../middlewares/verifyCustomerAuth.js";
import { optionalCustomerAuth } from "../middlewares/optionalCustomerAuth.js";
import {
  createOrder,
  getOrderForCustomerAccess,
  getOrdersByUserAndStore,
  getOrderItemsByOrderAndStore,
  updateOrderPayment,
  validateOrderStock,
  getStoreSettingsWithDisplayName,
} from "../core/database.js";
import type { CartItemPayload } from "../core/schema.js";
import type { AuthUser, Variables } from "../types.js";
import { createPaymentPIX, createPreference } from "../services/mercadopago.js";

const orders = new Hono<{ Bindings: Env; Variables: Variables }>();

function isValidGuestEmail(email: string): boolean {
  const t = email.trim();
  return t.length > 4 && t.includes("@") && !t.includes(" ");
}

/**
 * Cria pedido (usuário logado ou visitante, conforme public_profile.requireLoginToCheckout).
 */
orders.post("/", optionalCustomerAuth, async (c) => {
  const user = c.get("user") as AuthUser | undefined;
  const store = c.get("store");
  const body = (await c.req.json()) as {
    items?: CartItemPayload[];
    customerName?: string | null;
    customer_phone?: string | null;
    customerPhone?: string | null;
    delivery_address?: string | null;
    deliveryAddress?: string | null;
    guestEmail?: string | null;
    guest_email?: string | null;
  };

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return c.json({ success: false, error: "Items array is required" }, 400);
  }

  const customerPhone = body.customerPhone ?? body.customer_phone ?? null;
  const deliveryAddress = body.deliveryAddress ?? body.delivery_address ?? null;

  const phoneTrim = customerPhone != null ? String(customerPhone).trim() : "";
  const addressTrim = deliveryAddress != null ? String(deliveryAddress).trim() : "";
  if (!phoneTrim) {
    return c.json({ success: false, error: "Telefone é obrigatório" }, 400);
  }
  if (!addressTrim) {
    return c.json({ success: false, error: "Endereço de entrega é obrigatório" }, 400);
  }

  const storeSettings = await getStoreSettingsWithDisplayName(c.env, store.id);
  const requireLogin = storeSettings.publicProfile?.requireLoginToCheckout !== false;

  if (requireLogin && !user?.id) {
    return c.json({ success: false, error: "Faça login para finalizar o pedido." }, 401);
  }

  const guestEmailRaw = (body.guestEmail ?? body.guest_email ?? "").trim();
  if (!requireLogin && !user?.id) {
    if (!isValidGuestEmail(guestEmailRaw)) {
      return c.json(
        { success: false, error: "Informe um e-mail válido para finalizar sem login." },
        400
      );
    }
  }

  const orderTotal = body.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const minimumOrderValue = storeSettings.minimumOrderValue;
  if (minimumOrderValue != null && minimumOrderValue > 0 && orderTotal < minimumOrderValue) {
    return c.json(
      {
        success: false,
        error: `O valor mínimo para pedidos é R$ ${minimumOrderValue.toFixed(2).replace(".", ",")}.`,
      },
      400
    );
  }

  try {
    await validateOrderStock(c.env, store.id, body.items);
  } catch (stockErr: unknown) {
    const message = stockErr instanceof Error ? stockErr.message : "Estoque insuficiente";
    return c.json({ success: false, error: message }, 400);
  }

  try {
    const guestCheckoutEmail =
      !user?.id && guestEmailRaw ? guestEmailRaw.toLowerCase() : null;
    const { orderId, total } = await createOrder(c.env, {
      storeId: store.id,
      userId: user?.id ?? null,
      items: body.items,
      customerName: body.customerName ?? null,
      customerPhone: phoneTrim || null,
      deliveryAddress: addressTrim || null,
      guestCheckoutEmail,
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
orders.post("/:id/payment", optionalCustomerAuth, async (c) => {
  const user = c.get("user") as AuthUser | undefined;
  const store = c.get("store");
  const orderId = c.req.param("id");
  const body = (await c.req.json()) as {
    payment_method?: string;
    guestEmail?: string | null;
    guest_email?: string | null;
  };

  if (!body.payment_method) {
    return c.json({ success: false, error: "Payment method required" }, 400);
  }

  const guestEmail = body.guestEmail ?? body.guest_email ?? null;
  const order = await getOrderForCustomerAccess(c.env, orderId, store.id, {
    userId: user?.id,
    guestEmail: guestEmail ?? undefined,
  });
  if (!order) {
    return c.json({ success: false, error: "Pedido não encontrado" }, 404);
  }

  const token = c.env.MERCADO_PAGO_ACCESS_TOKEN;
  const payerEmail =
    order.guestCheckoutEmail?.trim() ||
    user?.email?.trim() ||
    "comprador@email.com";

  if (!token) {
    return c.json({ success: false, error: "Servidor não configurado (MP Token)" }, 500);
  }

  const baseUrl = (c.env as { NOTIFICATION_BASE_URL?: string }).NOTIFICATION_BASE_URL;
  const notificationUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/api/webhooks/mercadopago` : undefined;

  if (body.payment_method === "pix") {
    try {
      const idempotencyKey = crypto.randomUUID();

      const pix = await createPaymentPIX(token, {
        orderId,
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
          orderId,
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

  if (body.payment_method === "credit_card") {
    try {
      const items = await getOrderItemsByOrderAndStore(c.env, orderId, store.id);

      const prefItems = items.map((i) => ({
        title: i.productName,
        quantity: i.quantity,
        unit_price: Number(i.price),
      }));

      if (prefItems.length === 0) {
        prefItems.push({
          title: `Pedido #${orderId}`,
          quantity: 1,
          unit_price: order.total,
        });
      }

      const pref = await createPreference(token, {
        orderId,
        total: order.total,
        payerEmail,
        notificationUrl,
        items: prefItems,
      });

      await updateOrderPayment(c.env, orderId, store.id, "credit_card", {
        paymentStatus: "pending",
      });

      return c.json({
        success: true,
        data: {
          orderId,
          payment_method: "credit_card",
          init_point: pref.init_point,
        },
      }, 200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Falha ao gerar Cartão no Mercado Pago";
      console.error("Mercado Pago Cartão error:", err);
      return c.json({ success: false, error: message }, 500);
    }
  }

  return c.json({ success: false, error: "Método de pagamento inválido ou não suportado" }, 400);
});

/**
 * Histórico de pedidos do usuário na loja.
 */
orders.get("/", verifyCustomerAuth, async (c) => {
  const user = c.get("user") as AuthUser;
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
 * Detalhe de um pedido com itens (logado ou visitante com ?guestEmail=).
 */
orders.get("/:id", optionalCustomerAuth, async (c) => {
  const user = c.get("user") as AuthUser | undefined;
  const store = c.get("store");
  const orderId = c.req.param("id");
  const guestQ = c.req.query("guestEmail") ?? c.req.query("guest_email");

  const order = await getOrderForCustomerAccess(c.env, orderId, store.id, {
    userId: user?.id,
    guestEmail: guestQ ?? undefined,
  });
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
