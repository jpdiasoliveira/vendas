/**
 * Leituras de pedidos e itens (sempre com `store_id` quando aplicável).
 * Selects explícitos: menos dados trafegados Postgres → Worker → JSON e menos memória alocada no isolate.
 * Manter colunas alinhadas a `rowToOrder` / `rowToOrderItem` em `../mappers.js`.
 */

import { getSupabase } from "../../supabase.js";
import type { Order, OrderDetail, OrderItem } from "../../schema.js";
import { rowToOrder, rowToOrderItem } from "../mappers.js";

/** Colunas necessárias para `rowToOrder` (sem `*`). */
const ORDER_ROW_SELECT =
  "id, store_id, user_id, guest_checkout_email, customer_name, customer_phone, status, total, currency, payment_method, payment_id, metadata, delivery_address, shipping_postal_code, shipping_fee, coupon_code, coupon_discount, shipping_city, shipping_state, tracking_code, shipping_method, paid_at, delivered_at, notes, created_at, updated_at";

/** Colunas necessárias para `rowToOrderItem` (sem `*`). */
const ORDER_ITEM_ROW_SELECT =
  "id, order_id, store_id, product_id, product_name, product_image, quantity, price, created_at";

export async function getOrderForCustomerAccess(
  env: Env,
  orderId: string,
  storeId: string,
  ctx: { userId?: string; guestEmail?: string | null }
): Promise<Order | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("orders")
    .select(ORDER_ROW_SELECT)
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
    .select(ORDER_ROW_SELECT)
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (rows ?? []).map((r: Record<string, unknown>) => rowToOrder(r));
}

export async function getAllOrdersByStore(env: Env, storeId: string): Promise<Order[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("orders")
    .select(ORDER_ROW_SELECT)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (rows ?? []).map((r: Record<string, unknown>) => rowToOrder(r));
}

export async function getOrderItemsByOrderAndStore(
  env: Env,
  orderId: string,
  storeId: string
): Promise<OrderItem[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("order_items")
    .select(ORDER_ITEM_ROW_SELECT)
    .eq("order_id", orderId)
    .eq("store_id", storeId);

  if (error) throw new Error(error.message);
  return (rows ?? []).map((r: Record<string, unknown>) => rowToOrderItem(r));
}

export async function getOrderByIdForStore(
  env: Env,
  orderId: string,
  storeId: string
): Promise<Order | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("orders")
    .select(ORDER_ROW_SELECT)
    .eq("id", orderId)
    .eq("store_id", storeId)
    .single();
  if (error || !row) return null;
  return rowToOrder(row as Record<string, unknown>);
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

/**
 * Pedido por id sem filtro de loja. Uso restrito a fluxos que já amarram o id de forma segura
 * (ex.: `external_reference` do Mercado Pago + assinatura de webhook); demais leituras devem usar `store_id`.
 */
export async function getOrderById(env: Env, orderId: string): Promise<Order | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("orders")
    .select(ORDER_ROW_SELECT)
    .eq("id", orderId)
    .single();
  if (error || !row) return null;
  return rowToOrder(row as Record<string, unknown>);
}
