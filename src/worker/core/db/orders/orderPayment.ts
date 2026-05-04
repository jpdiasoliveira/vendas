/**
 * Persistência de método de pagamento e transições de status financeiro (Mercado Pago, etc.).
 */

import { getSupabase } from "../../supabase.js";
import { getOrderById } from "./orderReads.js";
import {
  cancelOrderForInsufficientStockAfterPayment,
  tryAtomicDecrementStockForOrder,
} from "./orderStock.js";
import {
  inventoryCommittedStatus,
  isPaidStatus,
  normalizeMpPaymentIdRef,
} from "./orderStatusHelpers.js";
import { logServerError } from "../../../utils/safeApiError.js";

export async function updateOrderPayment(
  env: Env,
  orderId: string,
  storeId: string,
  paymentMethod: string,
  options?: {
    paymentId?: number;
    paymentStatus?: string;
    paymentPreferenceId?: string | null;
  }
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
  if (options?.paymentPreferenceId !== undefined) {
    const raw = options.paymentPreferenceId;
    const pref = raw == null || String(raw).trim() === "" ? null : String(raw).trim();
    const { data: row, error: selErr } = await supabase
      .from("orders")
      .select("metadata")
      .match({ id: String(orderId), store_id: storeId })
      .maybeSingle();
    if (selErr) throw new Error(selErr.message);
    const prev = (row?.metadata as Record<string, unknown> | null) ?? {};
    const next: Record<string, unknown> = { ...prev };
    if (pref) next.mp_checkout_preference_id = pref;
    else delete next.mp_checkout_preference_id;
    payload.metadata = next;
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
  | "updated_non_paid"
  | "idempotent_skip"
  | "payment_id_conflict";

const MP_APPROVAL_RPC_OUTCOMES: ReadonlySet<UpdateOrderPaymentStatusOutcome> = new Set([
  "paid",
  "skipped_not_found",
  "idempotent_skip",
  "payment_id_conflict",
  "stock_conflict_cancelled",
  "updated_non_paid",
]);

export async function updateOrderPaymentStatus(
  env: Env,
  orderId: string,
  status: string,
  paymentInfo?: { paymentId?: number }
): Promise<UpdateOrderPaymentStatusOutcome> {
  const idStr = String(orderId);
  const incomingId = normalizeMpPaymentIdRef(paymentInfo?.paymentId);

  if (isPaidStatus(status) && incomingId) {
    const supabase = getSupabase(env);
    const { data, error } = await supabase.rpc("apply_mp_approval_with_order_lock", {
      p_order_id: idStr,
      p_mp_payment_id: incomingId,
    });
    if (error) throw new Error(error.message);
    const outcome = String(data ?? "").trim() as UpdateOrderPaymentStatusOutcome;
    if (!MP_APPROVAL_RPC_OUTCOMES.has(outcome)) {
      throw new Error(`apply_mp_approval_with_order_lock retorno inesperado: ${String(data)}`);
    }
    if (outcome === "stock_conflict_cancelled") {
      logServerError(
        `updateOrderPaymentStatus.MANUAL_REFUND_REQUIRED order=${idStr} mpPayment=${String(paymentInfo?.paymentId ?? "")}`,
        new Error(
          "INSUFFICIENT_STOCK_AT_MP_APPROVAL: pedido cancelado no sistema; estorno manual no MP se necessário."
        )
      );
    }
    return outcome;
  }

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
      });
      logServerError(
        `updateOrderPaymentStatus.MANUAL_REFUND_REQUIRED order=${idStr} store=${storeId} mpPayment=${String(paymentInfo?.paymentId ?? "")} detail=${dec.detail}`,
        new Error(
          "INSUFFICIENT_STOCK_AT_MP_APPROVAL: pedido cancelado no sistema; estorno manual no MP se necessário."
        )
      );
      return "stock_conflict_cancelled";
    }
  }

  const supabase = getSupabase(env);
  const st = status.trim().toLowerCase();
  const updateRow: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (incomingId) {
    updateRow.payment_id = incomingId;
  }
  if (st === "paid" || st === "approved") {
    updateRow.paid_at = new Date().toISOString();
  }

  const { error } = await supabase.from("orders").update(updateRow).match({ id: idStr, store_id: storeId });

  if (error) throw new Error(error.message);
  if (st === "paid" || st === "approved") return "paid";
  return "updated_non_paid";
}
