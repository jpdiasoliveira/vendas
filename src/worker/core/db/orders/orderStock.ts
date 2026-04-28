/**
 * Estoque atómico e reposições ligadas a pedidos.
 */

import { getSupabase } from "../../supabase.js";
import { getProductStock, updateProduct } from "../productsRepo.js";
import { getOrderItemsByOrderAndStore } from "./orderReads.js";
import { logServerError } from "../../../utils/safeApiError.js";

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
  logServerError("tryAtomicDecrementStockForOrder.rpc", error);
  throw new Error(msg || "Falha na baixa atômica de estoque (confira se a RPC foi aplicada no Supabase).");
}

/** Pedido cancelado após aprovação no MP sem estoque: exige estorno manual no gateway. */
export async function cancelOrderForInsufficientStockAfterPayment(
  env: Env,
  orderId: string,
  storeId: string,
  options: { mpPaymentId?: number }
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
    },
  };
  if (options.mpPaymentId != null) {
    payload.payment_id = String(options.mpPaymentId);
  }
  const { error } = await supabase.from("orders").update(payload).match({ id: orderId, store_id: storeId });
  if (error) throw new Error(error.message);
}

export async function increaseStockForOrder(env: Env, orderId: string, storeId: string): Promise<void> {
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
