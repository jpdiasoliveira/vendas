import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { verifyCustomerAuth } from "../middlewares/verifyCustomerAuth.js";
import { optionalCustomerAuth } from "../middlewares/optionalCustomerAuth.js";
import {
  createOrder,
  getOrderForCustomerAccess,
  getOrdersByUserAndStore,
  getOrderItemsByOrderAndStore,
  updateOrderPayment,
  getStoreSettingsWithDisplayName,
} from "../core/database.js";
import { resolveOrderLinesForCheckout, type ResolvedCheckoutLine } from "../core/db/productsRepo.js";
import type { CartItemPayload } from "../core/schema.js";
import { OrderBusinessError } from "../core/orderErrors.js";
import type { AuthUser, Variables } from "../types.js";
import { createPaymentPIX, createPreference } from "../services/mercadopago.js";
import { notifyOrderCreated } from "../services/notificationHooks.js";
import { logAuditEvent } from "../utils/audit.js";
import { genericServerErrorMessage, logServerError } from "../utils/safeApiError.js";
import { requireStoreContext } from "../utils/requireStoreContext.js";
import {
  buildOrderConfirmationUrl,
  isValidGuestEmail,
  resolveStorefrontBaseUrl,
} from "../utils/orderCheckoutUrls.js";
import {
  createOrderBodySchema,
  orderPaymentBodySchema,
} from "../schemas/orderPublic.js";
import { zodErrorToMessage } from "../utils/zodErrorMessage.js";

const orders = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Cria pedido (usuário logado ou visitante, conforme public_profile.requireLoginToCheckout).
 */
orders.post(
  "/",
  optionalCustomerAuth,
  zValidator("json", createOrderBodySchema, (result, c) => {
    if (!result.success) {
      return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
    }
  }),
  async (c) => {
    const user = c.get("user") as AuthUser | undefined;
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    const body = c.req.valid("json");

    const idempotencyKey =
      c.req.header("Idempotency-Key")?.trim() ||
      c.req.header("X-Idempotency-Key")?.trim() ||
      body.idempotencyKey?.trim() ||
      "";
    if (!idempotencyKey) {
      return c.json(
        {
          success: false,
          error:
            "Envie o header Idempotency-Key (UUID) em cada finalização para evitar pedidos duplicados.",
        },
        400
      );
    }

    const storeSettings = await getStoreSettingsWithDisplayName(c.env, store.id);
    const requireLogin = storeSettings.publicProfile?.requireLoginToCheckout !== false;

    if (requireLogin && !user?.id) {
      return c.json({ success: false, error: "Faça login para finalizar o pedido." }, 401);
    }

    const guestEmailRaw = body.guestEmailRaw;
    if (!requireLogin && !user?.id) {
      if (!isValidGuestEmail(guestEmailRaw)) {
        return c.json(
          { success: false, error: "Informe um e-mail válido para finalizar sem login." },
          400
        );
      }
    }

    let resolvedLines: ResolvedCheckoutLine[];
    try {
      resolvedLines = await resolveOrderLinesForCheckout(c.env, store.id, body.items as CartItemPayload[]);
    } catch (err: unknown) {
      if (err instanceof OrderBusinessError) {
        return c.json({ success: false, error: err.message }, 400);
      }
      const message = err instanceof Error ? err.message : "Não foi possível validar o carrinho.";
      return c.json({ success: false, error: message }, 400);
    }

    const itemsSubtotal = resolvedLines.reduce(
      (acc, line) => acc + line.unitPrice * line.quantity,
      0
    );
    const minimumOrderValue = storeSettings.minimumOrderValue;
    if (minimumOrderValue != null && minimumOrderValue > 0 && itemsSubtotal < minimumOrderValue) {
      return c.json(
        {
          success: false,
          error: `O valor mínimo para pedidos é R$ ${minimumOrderValue.toFixed(2).replace(".", ",")}.`,
        },
        400
      );
    }

    try {
      const guestCheckoutEmail =
        !user?.id && guestEmailRaw ? guestEmailRaw.toLowerCase() : null;
      const { orderId, total, shippingPostalCode: cepNorm, idempotent } = await createOrder(c.env, {
        storeId: store.id,
        userId: user?.id ?? null,
        items: body.items as CartItemPayload[],
        resolvedLines,
        shippingPostalCode: body.shippingPostalCode,
        couponCode: body.couponCode,
        customerName: body.customerName ?? null,
        customerPhone: body.customerPhone || null,
        deliveryAddress: body.deliveryAddress || null,
        guestCheckoutEmail,
        idempotencyKey,
      });
      const recipientEmail =
        user?.email?.trim() || guestCheckoutEmail || null;
      if (!idempotent) {
        await notifyOrderCreated(c.env, {
          storeId: store.id,
          orderId,
          userId: user?.id ?? null,
          total,
          shippingCep: cepNorm,
          recipientEmail,
        });
      }
      return c.json(
        { success: true, data: { orderId, status: "pending", total, idempotent } },
        idempotent ? 200 : 201
      );
    } catch (err: unknown) {
      if (err instanceof OrderBusinessError) {
        return c.json({ success: false, error: err.message }, 400);
      }
      logServerError("orders.post /", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  }
);

/**
 * Registra método de pagamento. Para PIX, chama a API do Mercado Pago e retorna QR Code e Copia e Cola.
 */
orders.post(
  "/:id/payment",
  optionalCustomerAuth,
  zValidator("json", orderPaymentBodySchema, (result, c) => {
    if (!result.success) {
      return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
    }
  }),
  async (c) => {
    const user = c.get("user") as AuthUser | undefined;
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    const orderId = c.req.param("id");
    const body = c.req.valid("json");

    const guestEmail = body.guestEmail;
    const order = await getOrderForCustomerAccess(c.env, orderId, store.id, {
      userId: user?.id,
      guestEmail: guestEmail ?? undefined,
    });
    if (!order) {
      return c.json({ success: false, error: "Pedido não encontrado" }, 404);
    }

    const fulfillment = String(order.status ?? "").trim().toLowerCase();
    if (fulfillment !== "pending") {
      return c.json(
        {
          success: false,
          error: "Este pedido não aceita novo pagamento neste estado.",
        },
        409
      );
    }

    const existingMpPaymentId = String(order.paymentId ?? "").trim();
    if (existingMpPaymentId !== "") {
      return c.json(
        {
          success: false,
          error:
            "Um pagamento já foi iniciado para este pedido no Mercado Pago. Use o QR Code ou o link anteriores, ou consulte o status na página de confirmação.",
        },
        409
      );
    }

    const prefExisting = String(order.paymentPreferenceId ?? "").trim();
    if (prefExisting !== "") {
      if (body.payment_method === "credit_card") {
        return c.json(
          {
            success: false,
            error:
              "O checkout com cartão já foi iniciado para este pedido. Use o link de pagamento anterior ou a página de confirmação.",
          },
          409
        );
      }
      if (body.payment_method === "pix") {
        return c.json(
          {
            success: false,
            error:
              "O checkout com cartão já foi iniciado para este pedido. Conclua por lá ou cancele no Mercado Pago antes de gerar PIX.",
          },
          409
        );
      }
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

        await logAuditEvent(c.env, {
          storeId: store.id,
          userId: user?.id ?? null,
          action: "PAYMENT_INTENT_PIX",
          resourceType: "order",
          resourceId: orderId,
          details: {
            actor: user?.id ? "authenticated_customer" : "guest_checkout",
            mp_payment_id: pix.paymentId,
            mp_status_at_creation: pix.status,
          },
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
        logServerError("orders.post /:id/payment pix", err);
        return c.json({ success: false, error: genericServerErrorMessage() }, 500);
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
        } else {
          const freight = order.shippingFee != null ? Number(order.shippingFee) : 0;
          const couponDisc = order.couponDiscount != null ? Number(order.couponDiscount) : 0;
          const adjustment = Math.round((freight - couponDisc) * 100) / 100;
          if (Math.abs(adjustment) >= 0.005) {
            prefItems.push({
              title: "Frete e cupom (ajuste)",
              quantity: 1,
              unit_price: adjustment,
            });
          }
        }

        const storefrontBase = resolveStorefrontBaseUrl(c.env, c.req.raw);
        const guestForUrl = order.guestCheckoutEmail?.trim() || guestEmail?.trim() || null;

        const pref = await createPreference(token, {
          orderId,
          total: order.total,
          payerEmail,
          notificationUrl,
          backUrls: {
            success: buildOrderConfirmationUrl(storefrontBase, orderId, guestForUrl, "success"),
            failure: buildOrderConfirmationUrl(storefrontBase, orderId, guestForUrl, "failure"),
            pending: buildOrderConfirmationUrl(storefrontBase, orderId, guestForUrl, "pending"),
          },
          items: prefItems,
        });

        await updateOrderPayment(c.env, orderId, store.id, "credit_card", {
          paymentStatus: "pending",
          paymentPreferenceId: pref.id,
        });

        await logAuditEvent(c.env, {
          storeId: store.id,
          userId: user?.id ?? null,
          action: "PAYMENT_INTENT_CHECKOUT_PRO",
          resourceType: "order",
          resourceId: orderId,
          details: {
            actor: user?.id ? "authenticated_customer" : "guest_checkout",
            mp_preference_id: pref.id,
          },
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
        logServerError("orders.post /:id/payment credit_card", err);
        return c.json({ success: false, error: genericServerErrorMessage() }, 500);
      }
    }

    return c.json({ success: false, error: "Método de pagamento inválido ou não suportado" }, 400);
  }
);

/**
 * Histórico de pedidos do usuário na loja.
 */
orders.get("/", verifyCustomerAuth, async (c) => {
  const user = c.get("user") as AuthUser;
  const store = requireStoreContext(c);
  if (store instanceof Response) return store;

  try {
    const data = await getOrdersByUserAndStore(c.env, user.id, store.id);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    logServerError("orders.get /", err);
    return c.json({ success: false, error: genericServerErrorMessage() }, 500);
  }
});

/**
 * Detalhe de um pedido com itens (logado ou visitante com ?guestEmail=).
 */
orders.get("/:id", optionalCustomerAuth, async (c) => {
  const user = c.get("user") as AuthUser | undefined;
  const store = requireStoreContext(c);
  if (store instanceof Response) return store;
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
    logServerError("orders.get /:id items", err);
    return c.json({ success: false, error: genericServerErrorMessage() }, 500);
  }
});

export default orders;
