/**
 * CRUD admin: cupons (`store_coupons`).
 */

import type { StoreCoupon } from "../../../contracts/schema.js";
import { getSupabase } from "../supabase.js";
import { normalizeCouponCode } from "./couponsRepo.js";
import { rowToStoreCoupon } from "./mappers.js";

const SELECT =
  "id, store_id, code, discount_type, discount_value, valid_from, valid_until, active, created_at, updated_at";

function parseIsoDate(raw: string | null | undefined, fieldLabel: string): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) throw new Error(`${fieldLabel} é obrigatória.`);
  const ms = Date.parse(trimmed);
  if (!Number.isFinite(ms)) throw new Error(`${fieldLabel} inválida.`);
  return new Date(ms).toISOString();
}

export async function getCouponsByStore(env: Env, storeId: string): Promise<StoreCoupon[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("store_coupons")
    .select(SELECT)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (rows ?? []).map((r) => rowToStoreCoupon(r as Record<string, unknown>));
}

export async function getCouponByIdAndStore(
  env: Env,
  couponId: string,
  storeId: string,
): Promise<StoreCoupon | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("store_coupons")
    .select(SELECT)
    .eq("id", couponId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return row ? rowToStoreCoupon(row as Record<string, unknown>) : null;
}

export async function createCoupon(
  env: Env,
  storeId: string,
  params: {
    code: string;
    discountType: "percent" | "fixed";
    discountValue: number;
    validFrom?: string | null;
    validUntil: string;
    active?: boolean;
  },
): Promise<StoreCoupon> {
  const code = normalizeCouponCode(params.code);
  if (!code) throw new Error("Informe o código do cupom.");

  const validFrom = params.validFrom
    ? parseIsoDate(params.validFrom, "Data de início")
    : new Date().toISOString();
  const validUntil = parseIsoDate(params.validUntil, "Data de validade");
  if (Date.parse(validUntil) < Date.parse(validFrom)) {
    throw new Error("Data de validade deve ser posterior ao início.");
  }

  const supabase = getSupabase(env);
  const now = new Date().toISOString();
  const { data: row, error } = await supabase
    .from("store_coupons")
    .insert({
      store_id: storeId,
      code,
      discount_type: params.discountType,
      discount_value: params.discountValue,
      valid_from: validFrom,
      valid_until: validUntil,
      active: params.active ?? true,
      created_at: now,
      updated_at: now,
    })
    .select(SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Já existe um cupom com este código nesta loja.");
    }
    throw new Error(error.message);
  }
  return rowToStoreCoupon(row as Record<string, unknown>);
}

export async function updateCoupon(
  env: Env,
  couponId: string,
  storeId: string,
  params: {
    code?: string;
    discountType?: "percent" | "fixed";
    discountValue?: number;
    validFrom?: string | null;
    validUntil?: string;
    active?: boolean;
  },
): Promise<StoreCoupon> {
  const existing = await getCouponByIdAndStore(env, couponId, storeId);
  if (!existing) throw new Error("Cupom não encontrado.");

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (params.code != null) {
    const code = normalizeCouponCode(params.code);
    if (!code) throw new Error("Informe o código do cupom.");
    patch.code = code;
  }
  if (params.discountType != null) patch.discount_type = params.discountType;
  if (params.discountValue != null) patch.discount_value = params.discountValue;
  if (params.validFrom !== undefined) {
    patch.valid_from = params.validFrom ? parseIsoDate(params.validFrom, "Data de início") : new Date().toISOString();
  }
  if (params.validUntil != null) {
    patch.valid_until = parseIsoDate(params.validUntil, "Data de validade");
  }
  if (params.active != null) patch.active = params.active;

  const validFrom = String(patch.valid_from ?? existing.validFrom);
  const validUntil = String(patch.valid_until ?? existing.validUntil);
  if (Date.parse(validUntil) < Date.parse(validFrom)) {
    throw new Error("Data de validade deve ser posterior ao início.");
  }

  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("store_coupons")
    .update(patch)
    .eq("id", couponId)
    .eq("store_id", storeId)
    .select(SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Já existe um cupom com este código nesta loja.");
    }
    throw new Error(error.message);
  }
  return rowToStoreCoupon(row as Record<string, unknown>);
}

export async function deleteCoupon(env: Env, couponId: string, storeId: string): Promise<void> {
  const supabase = getSupabase(env);
  const { error } = await supabase.from("store_coupons").delete().eq("id", couponId).eq("store_id", storeId);
  if (error) throw new Error(error.message);
}
