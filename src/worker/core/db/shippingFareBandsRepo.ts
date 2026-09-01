/**
 * CRUD admin: faixas de frete por CEP (`store_shipping_fare_bands`).
 */

import type { ShippingFareBand } from "../../../contracts/schema.js";
import { getSupabase } from "../supabase.js";
import { rowToShippingFareBand } from "./mappers.js";

const SELECT =
  "id, store_id, cep_from, cep_to, amount_brl, label, created_at, updated_at";

function rangesOverlap(fromA: number, toA: number, fromB: number, toB: number): boolean {
  return fromA <= toB && fromB <= toA;
}

async function assertNoOverlap(
  env: Env,
  storeId: string,
  cepFrom: number,
  cepTo: number,
  excludeId?: string,
): Promise<void> {
  const bands = await getShippingFareBandsByStore(env, storeId);
  for (const band of bands) {
    if (excludeId && band.id === excludeId) continue;
    if (rangesOverlap(cepFrom, cepTo, band.cepFrom, band.cepTo)) {
      throw new Error("Esta faixa de CEP sobrepõe outra faixa já cadastrada.");
    }
  }
}

export async function getShippingFareBandsByStore(env: Env, storeId: string): Promise<ShippingFareBand[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("store_shipping_fare_bands")
    .select(SELECT)
    .eq("store_id", storeId)
    .order("cep_from", { ascending: true });

  if (error) throw new Error(error.message);
  return (rows ?? []).map((r) => rowToShippingFareBand(r as Record<string, unknown>));
}

export async function getShippingFareBandByIdAndStore(
  env: Env,
  bandId: string,
  storeId: string,
): Promise<ShippingFareBand | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("store_shipping_fare_bands")
    .select(SELECT)
    .eq("id", bandId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return row ? rowToShippingFareBand(row as Record<string, unknown>) : null;
}

export async function createShippingFareBand(
  env: Env,
  storeId: string,
  params: { cepFrom: number; cepTo: number; amountBrl: number; label?: string | null },
): Promise<ShippingFareBand> {
  if (params.cepFrom > params.cepTo) {
    throw new Error("CEP inicial não pode ser maior que o CEP final.");
  }
  await assertNoOverlap(env, storeId, params.cepFrom, params.cepTo);

  const supabase = getSupabase(env);
  const now = new Date().toISOString();
  const { data: row, error } = await supabase
    .from("store_shipping_fare_bands")
    .insert({
      store_id: storeId,
      cep_from: params.cepFrom,
      cep_to: params.cepTo,
      amount_brl: params.amountBrl,
      label: params.label?.trim() || null,
      created_at: now,
      updated_at: now,
    })
    .select(SELECT)
    .single();

  if (error) throw new Error(error.message);
  return rowToShippingFareBand(row as Record<string, unknown>);
}

export async function updateShippingFareBand(
  env: Env,
  bandId: string,
  storeId: string,
  params: {
    cepFrom?: number;
    cepTo?: number;
    amountBrl?: number;
    label?: string | null;
  },
): Promise<ShippingFareBand> {
  const existing = await getShippingFareBandByIdAndStore(env, bandId, storeId);
  if (!existing) throw new Error("Faixa de frete não encontrada.");

  const cepFrom = params.cepFrom ?? existing.cepFrom;
  const cepTo = params.cepTo ?? existing.cepTo;
  if (cepFrom > cepTo) {
    throw new Error("CEP inicial não pode ser maior que o CEP final.");
  }
  await assertNoOverlap(env, storeId, cepFrom, cepTo, bandId);

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (params.cepFrom != null) patch.cep_from = params.cepFrom;
  if (params.cepTo != null) patch.cep_to = params.cepTo;
  if (params.amountBrl != null) patch.amount_brl = params.amountBrl;
  if (params.label !== undefined) patch.label = params.label?.trim() || null;

  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("store_shipping_fare_bands")
    .update(patch)
    .eq("id", bandId)
    .eq("store_id", storeId)
    .select(SELECT)
    .single();

  if (error) throw new Error(error.message);
  return rowToShippingFareBand(row as Record<string, unknown>);
}

export async function deleteShippingFareBand(env: Env, bandId: string, storeId: string): Promise<void> {
  const supabase = getSupabase(env);
  const { error } = await supabase
    .from("store_shipping_fare_bands")
    .delete()
    .eq("id", bandId)
    .eq("store_id", storeId);
  if (error) throw new Error(error.message);
}
