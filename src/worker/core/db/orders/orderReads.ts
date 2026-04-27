/**
 * Leituras de pedidos e itens (sempre com `store_id` quando aplicável).
 */

import { getSupabase } from "../../supabase.js";
import type { Order, OrderDetail, OrderItem } from "../../schema.js";
import { rowToOrder, rowToOrderItem } from "../mappers.js";

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
  return (rows ?? []).map((r: Record<string, unknown>) => rowToOrder(r));
}

export async function getAllOrdersByStore(env: Env, storeId: string): Promise<Order[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("orders")
    .select("*")
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
    .select("*")
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
    .select("*")
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
    .select("*")
    .eq("id", orderId)
    .single();
  if (error || !row) return null;
  return rowToOrder(row as Record<string, unknown>);
}
