/**
 * Repositório: pedidos e itens (`order_items`, com `store_id`). Leituras e mutações na loja filtram por `store_id`.
 * Fluxos de webhook usam `getOrderById` (ver JSDoc na função) após validar origem do gateway.
 */

import { getSupabase } from "../supabase.js";
import type { CartItemPayload, Order, OrderDetail, OrderItem } from "../schema.js";
import { rowToOrder, rowToOrderItem } from "./mappers.js";
import { getProductStock, updateProduct } from "./productsRepo.js";

export async function createOrder(
  env: Env,
  params: {
    storeId: string;
    userId: string | null;
    items: CartItemPayload[];
    customerName?: string | null;
    customerPhone?: string | null;
    deliveryAddress?: string | null;
    guestCheckoutEmail?: string | null;
  }
): Promise<{ orderId: string; total: number }> {
  const supabase = getSupabase(env);
  const total = params.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const orderPayload: Record<string, unknown> = {
    store_id: params.storeId,
    user_id: params.userId,
    total,
    currency: "BRL",
    payment_method: null,
    status: "pending",
  };
  if (params.userId == null) {
    const guestEmailTrim =
      params.guestCheckoutEmail != null ? String(params.guestCheckoutEmail).trim() : "";
    if (guestEmailTrim !== "") {
      orderPayload.guest_checkout_email = guestEmailTrim.toLowerCase();
    }
  }
  if (params.customerName != null && String(params.customerName).trim() !== "")
    orderPayload.customer_name = String(params.customerName).trim();
  if (params.customerPhone != null && String(params.customerPhone).trim() !== "")
    orderPayload.customer_phone = String(params.customerPhone).trim();
  if (params.deliveryAddress != null && String(params.deliveryAddress).trim() !== "")
    orderPayload.delivery_address = String(params.deliveryAddress).trim();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(orderPayload)
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  const mappedItems = params.items.map((item) => ({
    order_id: order.id,
    store_id: params.storeId,
    product_id: item.id,
    product_name: item.name || "Produto",
    product_image: item.image ?? item.imageUrl ?? null,
    quantity: item.quantity,
    price: item.price,
    metadata: {},
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(mappedItems);
  if (itemsError) throw new Error(itemsError.message);

  return { orderId: String(order.id), total };
}

export async function getOrderForCustomerAccess(
  env: Env,
  orderId: string,
  storeId: string,
  ctx: { userId?: string; guestEmail?: string | null }
): Promise<Order | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (error || !row) return null;
  const r = row as Record<string, unknown>;
  const uid = r.user_id != null ? String(r.user_id) : null;
  if (uid != null) {
    if (!ctx.userId || ctx.userId !== uid) return null;
    return rowToOrder(r);
  }
  const ge = (ctx.guestEmail ?? "").trim().toLowerCase();
  const stored = String(r.guest_checkout_email ?? "").trim().toLowerCase();
  if (!ge || !stored || ge !== stored) return null;
  return rowToOrder(r);
}

export async function getOrderByIdAndStore(
  env: Env,
  orderId: string,
  userId: string,
  storeId: string
): Promise<Order | null> {
  return getOrderForCustomerAccess(env, orderId, storeId, { userId });
}

export async function getOrdersByUserAndStore(
  env: Env,
  userId: string,
  storeId: string
): Promise<Order[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (rows ?? []).map((r) => rowToOrder(r as Record<string, unknown>));
}

export async function getAllOrdersByStore(env: Env, storeId: string): Promise<Order[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (rows ?? []).map((r) => rowToOrder(r as Record<string, unknown>));
}

export async function getOrderItemsByOrderAndStore(
  env: Env,
  orderId: string,
  storeId: string
): Promise<OrderItem[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .eq("store_id", storeId);

  if (error) throw new Error(error.message);
  return (rows ?? []).map((r) => rowToOrderItem(r as Record<string, unknown>));
}

export async function getOrderWithItems(
  env: Env,
  orderId: string,
  storeId: string
): Promise<OrderDetail | null> {
  const order = await getOrderByIdForStore(env, orderId, storeId);
  if (!order) return null;
  const items = await getOrderItemsByOrderAndStore(env, orderId, storeId);
  return { ...order, items } satisfies OrderDetail;
}

async function getOrderByIdForStore(
  env: Env,
  orderId: string,
  storeId: string
): Promise<Order | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("store_id", storeId)
    .single();
  if (error || !row) return null;
  return rowToOrder(row as Record<string, unknown>);
}

/**
 * Pedido por id sem filtro de loja. Uso restrito a fluxos que já amarram o id de forma segura
 * (ex.: `external_reference` do Mercado Pago + assinatura de webhook); demais leituras devem usar `store_id`.
 */
export async function getOrderById(env: Env, orderId: string): Promise<Order | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (error || !row) return null;
  return rowToOrder(row as Record<string, unknown>);
}

const ORDER_STATUS_EN = [
  "pending",
  "paid",
  "approved",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export function normalizeOrderStatus(
  raw: string | null | undefined
): (typeof ORDER_STATUS_EN)[number] | null {
  const s = raw?.trim()?.toLowerCase();
  if (!s) return null;
  const map: Record<string, (typeof ORDER_STATUS_EN)[number]> = {
    pendente: "pending",
    pending: "pending",
    pago: "paid",
    paid: "paid",
    approved: "approved",
    enviado: "shipped",
    shipped: "shipped",
    entregue: "delivered",
    delivered: "delivered",
    cancelado: "cancelled",
    cancelled: "cancelled",
    canceled: "cancelled",
  };
  const normalized = map[s];
  return normalized && ORDER_STATUS_EN.includes(normalized) ? normalized : null;
}

const PAID_STATUSES = ["paid", "approved"];

function isPaidStatus(s: string | null | undefined): boolean {
  return !!s && PAID_STATUSES.includes(s.toLowerCase());
}

function inventoryCommittedStatus(s: string | null | undefined): boolean {
  if (!s) return false;
  const t = s.toLowerCase();
  return t === "paid" || t === "approved" || t === "shipped" || t === "delivered";
}

/**
 * Baixa de estoque atômica via RPC `decrement_stock_for_order` (ver docs/supabase-rpc-decrement-order-stock.sql).
 */
export async function tryAtomicDecrementStockForOrder(
  env: Env,
  orderId: string,
  storeId: string
): Promise<{ ok: true } | { ok: false; detail: string }> {
  const supabase = getSupabase(env);
  const { error } = await supabase.rpc("decrement_stock_for_order", {
    p_order_id: orderId,
    p_store_id: storeId,
  });
  if (!error) return { ok: true };
  const msg = error.message ?? String(error);
  if (msg.includes("INSUFFICIENT_STOCK")) {
    return { ok: false, detail: msg };
  }
  console.error("[tryAtomicDecrementStockForOrder.rpc]", error);
  throw new Error(msg || "Falha na baixa atômica de estoque (confira se a RPC foi aplicada no Supabase).");
}

/** Pedido cancelado após aprovação no MP sem estoque: exige estorno manual no gateway. */
export async function cancelOrderForInsufficientStockAfterPayment(
  env: Env,
  orderId: string,
  storeId: string,
  options: { mpPaymentId?: number; detail: string }
): Promise<void> {
  const supabase = getSupabase(env);
  const { data: row, error: selErr } = await supabase
    .from("orders")
    .select("metadata")
    .eq("id", orderId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);
  const prevMeta = (row?.metadata as Record<string, unknown> | null) ?? {};
  const payload: Record<string, unknown> = {
    status: "cancelled",
    updated_at: new Date().toISOString(),
    metadata: {
      ...prevMeta,
      insufficient_stock_at_payment: true,
      insufficient_stock_detail: options.detail,
    },
  };
  if (options.mpPaymentId != null) {
    payload.payment_id = String(options.mpPaymentId);
  }
  const { error } = await supabase.from("orders").update(payload).match({ id: orderId, store_id: storeId });
  if (error) throw new Error(error.message);
}

export async function increaseStockForOrder(
  env: Env,
  orderId: string,
  storeId: string
): Promise<void> {
  const items = await getOrderItemsByOrderAndStore(env, orderId, storeId);
  for (const item of items) {
    if (!item.productId) continue;
    try {
      const current = await getProductStock(env, item.productId, storeId);
      if (current === null) {
        console.error("[increaseStockForOrder] Produto não encontrado, pulando:", {
          orderId,
          productId: item.productId,
          storeId,
        });
        continue;
      }
      const newStock = current + item.quantity;
      await updateProduct(env, item.productId, storeId, { stock: newStock });
    } catch (err) {
      console.error("[increaseStockForOrder] Erro ao estornar estoque do item:", {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
    }
  }
}

export async function updateOrderStatus(
  env: Env,
  orderId: string,
  storeId: string,
  newStatus: string
): Promise<void> {
  const idStr = String(orderId);
  const order = await getOrderByIdForStore(env, idStr, storeId);
  const oldStatus = order?.status ?? null;
  const statusLower = newStatus.trim().toLowerCase();
  const isCanceled = statusLower === "cancelled" || statusLower === "canceled";

  if (inventoryCommittedStatus(oldStatus) && isCanceled) {
    try {
      await increaseStockForOrder(env, idStr, storeId);
    } catch (stockErr) {
      console.error("[updateOrderStatus] Erro ao repor estoque no cancelamento:", {
        orderId: idStr,
        storeId,
        newStatus,
        oldStatus,
        error: stockErr instanceof Error ? stockErr.message : String(stockErr),
        stack: stockErr instanceof Error ? stockErr.stack : undefined,
      });
    }
  } else if (isPaidStatus(newStatus) && !inventoryCommittedStatus(oldStatus)) {
    const dec = await tryAtomicDecrementStockForOrder(env, idStr, storeId);
    if (!dec.ok) {
      throw new Error(
        `Estoque insuficiente para marcar o pedido como pago (${dec.detail}). Ajuste o estoque ou cancele o pedido.`
      );
    }
  }

  const supabase = getSupabase(env);
  const updateRow: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (statusLower === "paid" || statusLower === "approved") {
    updateRow.paid_at = new Date().toISOString();
  }
  if (statusLower === "delivered") {
    updateRow.delivered_at = new Date().toISOString();
  }

  const { error } = await supabase.from("orders").update(updateRow).match({ id: idStr, store_id: storeId });
  if (error) throw new Error(error.message);
}

export async function updateOrderTracking(
  env: Env,
  orderId: string,
  storeId: string,
  payload: { trackingCode?: string | null; shippingMethod?: string | null }
): Promise<void> {
  const supabase = getSupabase(env);
  const order = await getOrderByIdForStore(env, orderId, storeId);
  if (!order) throw new Error("Pedido não encontrado");

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.trackingCode !== undefined) update.tracking_code = payload.trackingCode ?? null;
  if (payload.shippingMethod !== undefined) update.shipping_method = payload.shippingMethod ?? null;

  const trackingTrim =
    payload.trackingCode !== undefined ? String(payload.trackingCode ?? "").trim() : "";
  if (trackingTrim.length > 0) {
    const prev = (order.status ?? "").toLowerCase();
    const terminal = prev === "shipped" || prev === "delivered" || prev === "cancelled" || prev === "canceled";
    if (isPaidStatus(order.status) && !terminal) {
      update.status = "shipped";
    }
  }

  const { error } = await supabase
    .from("orders")
    .update(update)
    .match({ id: orderId, store_id: storeId });
  if (error) throw new Error(error.message);
}

export async function updateOrderPayment(
  env: Env,
  orderId: string,
  storeId: string,
  paymentMethod: string,
  options?: { paymentId?: number; paymentStatus?: string }
): Promise<void> {
  const supabase = getSupabase(env);
  const payload: Record<string, unknown> = {
    payment_method: paymentMethod,
    status: options?.paymentStatus ?? "pending",
    updated_at: new Date().toISOString(),
  };
  if (options?.paymentId != null) {
    payload.payment_id = String(options.paymentId);
  }
  const { error } = await supabase
    .from("orders")
    .update(payload)
    .match({ id: String(orderId), store_id: storeId });

  if (error) throw new Error(error.message);
}

export type UpdateOrderPaymentStatusOutcome =
  | "paid"
  | "stock_conflict_cancelled"
  | "skipped_not_found"
  | "updated_non_paid";

export async function updateOrderPaymentStatus(
  env: Env,
  orderId: string,
  status: string,
  paymentInfo?: { paymentId?: number }
): Promise<UpdateOrderPaymentStatusOutcome> {
  const idStr = String(orderId);
  const order = await getOrderById(env, idStr);
  if (!order) {
    console.warn("[updateOrderPaymentStatus] Pedido não encontrado, update ignorado:", idStr);
    return "skipped_not_found";
  }
  const storeId = order.storeId;
  const prev = order.status ?? null;

  if (isPaidStatus(status) && !inventoryCommittedStatus(prev)) {
    const dec = await tryAtomicDecrementStockForOrder(env, idStr, storeId);
    if (!dec.ok) {
      await cancelOrderForInsufficientStockAfterPayment(env, idStr, storeId, {
        mpPaymentId: paymentInfo?.paymentId,
        detail: dec.detail,
      });
      console.error("[updateOrderPaymentStatus.MANUAL_REFUND_REQUIRED]", {
        reason: "INSUFFICIENT_STOCK_AT_MP_APPROVAL",
        orderId: idStr,
        storeId,
        mpPaymentId: paymentInfo?.paymentId ?? null,
        rpcDetail: dec.detail,
        message:
          "Pedido cancelado no sistema: pagamento aprovado no Mercado Pago mas estoque insuficiente. Efetue estorno manual no MP.",
      });
      return "stock_conflict_cancelled";
    }
  }

  const supabase = getSupabase(env);
  const st = status.trim().toLowerCase();
  const updateRow: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (st === "paid" || st === "approved") {
    updateRow.paid_at = new Date().toISOString();
  }

  const { error } = await supabase.from("orders").update(updateRow).match({ id: idStr, store_id: storeId });

  if (error) throw new Error(error.message);
  if (st === "paid" || st === "approved") return "paid";
  return "updated_non_paid";
}
