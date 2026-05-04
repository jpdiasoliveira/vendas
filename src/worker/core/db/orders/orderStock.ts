/**
 * Estoque atómico e reposições ligadas a pedidos (sempre com `store_id` nas RPCs e leituras).
 */

import { getSupabase } from "../../supabase.js";
import { getProductById, getProductStock, updateProduct } from "../productsRepo.js";
import { getOrderItemsByOrderAndStore } from "./orderReads.js";
import { logServerError } from "../../../utils/safeApiError.js";
import { orderHasStockReservedAtCreate } from "./orderStatusHelpers.js";
import { OrderBusinessError } from "../../orderErrors.js";

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

/**
 * Validação imediata antes de criar cobrança no MP: pedidos legacy (sem reserva na criação)
 * exigem stock ≥ quantidade; com `stock_reserved_at_create` o saldo já inclui a reserva —
 * bloqueia só se o produto sumiu ou o stock ficou incoerente (negativo).
 */
export async function assertStockOkForPaymentIntent(
  env: Env,
  orderId: string,
  storeId: string,
  orderMetadata: Record<string, unknown> | null | undefined
): Promise<void> {
  const items = await getOrderItemsByOrderAndStore(env, orderId, storeId);
  const reserved = orderHasStockReservedAtCreate(orderMetadata);

  for (const item of items) {
    if (!item.productId) continue;
    const label = item.productName?.trim() || "Produto";
    const p = await getProductById(env, item.productId, storeId);
    if (!p) {
      throw new OrderBusinessError(
        `O produto «${label}» já não está disponível nesta loja. Contacte o suporte ou refaça o pedido.`
      );
    }
    const qty = Math.floor(Number(item.quantity));
    if (!Number.isFinite(qty) || qty < 1) continue;

    if (!reserved) {
      const stock = p.stock ?? 0;
      if (stock < qty) {
        throw new OrderBusinessError(
          `Estoque insuficiente para «${p.name || label}». Atualize o pedido antes de pagar.`
        );
      }
    } else {
      const stock = p.stock ?? 0;
      if (stock < 0) {
        throw new OrderBusinessError(
          "Incoerência de estoque no catálogo desta loja. Tente novamente mais tarde ou contacte o lojista."
        );
      }
    }
  }
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

  if (orderHasStockReservedAtCreate(prevMeta)) {
    try {
      await increaseStockForOrder(env, orderId, storeId);
    } catch (e) {
      logServerError("cancelOrderForInsufficientStockAfterPayment.restore", e);
    }
  }
}

/** Fallback não-atómico se a RPC `restore_stock_for_order` ainda não estiver aplicada no projeto. */
async function increaseStockForOrderLegacyLoop(env: Env, orderId: string, storeId: string): Promise<void> {
  const items = await getOrderItemsByOrderAndStore(env, orderId, storeId);
  for (const item of items) {
    if (!item.productId) continue;
    try {
      const current = await getProductStock(env, item.productId, storeId);
      if (current === null) {
        logServerError(
          "increaseStockForOrderLegacyLoop.product_missing",
          new Error(`order=${orderId} product=${item.productId} store=${storeId}`)
        );
        continue;
      }
      const newStock = current + item.quantity;
      await updateProduct(env, item.productId, storeId, { stock: newStock });
    } catch (err) {
      logServerError("increaseStockForOrderLegacyLoop.item", err);
    }
  }
}

/**
 * Repõe estoque dos itens do pedido. Preferencialmente via RPC atómica
 * `restore_stock_for_order` (docs/supabase-rpc-restore-order-stock.sql).
 */
export async function increaseStockForOrder(env: Env, orderId: string, storeId: string): Promise<void> {
  const supabase = getSupabase(env);
  const { error } = await supabase.rpc("restore_stock_for_order", {
    p_order_id: orderId,
    p_store_id: storeId,
  });
  if (!error) return;
  const msg = error.message ?? String(error);
  const missingFn =
    msg.includes("restore_stock_for_order") ||
    msg.includes("Could not find the function") ||
    /function .* does not exist/i.test(msg);
  if (missingFn) {
    logServerError(
      "increaseStockForOrder.rpc_missing",
      new Error(
        "Aplique migrations/7.sql (restore_stock_for_order). A usar fallback legado não-atómico para esta reposição."
      )
    );
    await increaseStockForOrderLegacyLoop(env, orderId, storeId);
    return;
  }
  logServerError("increaseStockForOrder.rpc", error);
  throw new Error(msg || "Falha ao repor estoque.");
}
