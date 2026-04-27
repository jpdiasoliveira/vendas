/**
 * Metadados, notas, normalização de status logístico e atualização de envio.
 */

import { getSupabase } from "../../supabase.js";
import type { Order } from "../../schema.js";
import { getOrderByIdForStore } from "./orderReads.js";
import { increaseStockForOrder, tryAtomicDecrementStockForOrder } from "./orderStock.js";
import { inventoryCommittedStatus, isPaidStatus } from "./orderStatusHelpers.js";
import { notifyOrderShipped } from "../../../services/notificationHooks.js";

/** Pedido em estado em que cancelamento pode exigir estorno no gateway (não automático aqui). */
export const orderRequiresManualRefundWorkflow = (order: Order): boolean => {
  if (order.paidAt && String(order.paidAt).trim() !== "") return true;
  const s = (order.status ?? "").toLowerCase();
  return s === "paid" || s === "approved" || s === "shipped" || s === "delivered";
};

export async function mergeOrderMetadata(
  env: Env,
  orderId: string,
  storeId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabase(env);
  const { data: row, error: selErr } = await supabase
    .from("orders")
    .select("metadata")
    .eq("id", orderId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);
  const prev = (row?.metadata as Record<string, unknown> | null) ?? {};
  const { error } = await supabase
    .from("orders")
    .update({
      metadata: { ...prev, ...patch },
      updated_at: new Date().toISOString(),
    })
    .match({ id: orderId, store_id: storeId });
  if (error) throw new Error(error.message);
}

export async function appendOrderNoteLine(
  env: Env,
  orderId: string,
  storeId: string,
  line: string
): Promise<void> {
  const supabase = getSupabase(env);
  const { data: row, error: selErr } = await supabase
    .from("orders")
    .select("notes")
    .eq("id", orderId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);
  const prev = (row?.notes as string | null) ?? "";
  const trimmed = line.trim();
  if (!trimmed) return;
  const next = prev.trim() ? `${prev.trim()}\n${trimmed}` : trimmed;
  const { error } = await supabase
    .from("orders")
    .update({ notes: next, updated_at: new Date().toISOString() })
    .match({ id: orderId, store_id: storeId });
  if (error) throw new Error(error.message);
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

  if (update.status === "shipped") {
    await notifyOrderShipped(env, {
      storeId,
      orderId: String(orderId),
      userId: order.userId,
      recipientEmail: order.guestCheckoutEmail?.trim() || null,
    });
  }
}
