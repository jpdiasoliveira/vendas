/**
 * Repositório: lojas (tenants) e configurações (store_settings).
 * Toda leitura/escrita de settings é filtrada por store_id.
 */

import { getSupabase } from "../supabase.js";
import type { Store, StoreSettings } from "../schema.js";
import {
  parsePublicProfile,
  toPublicProfileJson,
  type StorePublicProfile,
} from "../storePublicProfile.js";
import { rowToStore } from "./mappers.js";

/** Loja ativa por slug (tenant resolvido pelo middleware x-store-slug). */
export async function getStoreBySlug(env: Env, slug: string): Promise<Store | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) return null;

  return rowToStore(row as Record<string, unknown>);
}

/** Configurações + display_name; sempre .eq("store_id", storeId). */
export async function getStoreSettingsWithDisplayName(
  env: Env,
  storeId: string
): Promise<StoreSettings> {
  const supabase = getSupabase(env);
  const { data: storeRow, error: storeError } = await supabase
    .from("stores")
    .select("display_name")
    .eq("id", storeId)
    .maybeSingle();
  if (storeError) throw new Error(storeError.message);

  const { data: settingsRow, error: settingsError } = await supabase
    .from("store_settings")
    .select(
      "logo_url, primary_color, minimum_order_value, public_profile, theme, business_rules, operating_hours, order_limits"
    )
    .eq("store_id", storeId)
    .maybeSingle();
  if (settingsError) throw new Error(settingsError.message);

  return {
    displayName: (storeRow?.display_name as string) ?? "",
    logoUrl: settingsRow?.logo_url ?? null,
    primaryColor: settingsRow?.primary_color ?? null,
    minimumOrderValue:
      settingsRow?.minimum_order_value != null ? Number(settingsRow.minimum_order_value) : null,
    publicProfile: parsePublicProfile(settingsRow?.public_profile),
    theme: (settingsRow?.theme as Record<string, unknown> | null) ?? null,
    businessRules: (settingsRow?.business_rules as Record<string, unknown> | null) ?? null,
    operatingHours: (settingsRow?.operating_hours as Record<string, unknown> | null) ?? null,
    orderLimits: (settingsRow?.order_limits as Record<string, unknown> | null) ?? null,
  };
}

/** Upsert de settings e update de stores só no id = storeId. */
export async function updateStoreSettingsAndDisplayName(
  env: Env,
  storeId: string,
  payload: {
    displayName?: string | null;
    logoUrl?: string | null;
    primaryColor?: string | null;
    minimumOrderValue?: number | null;
    publicProfile?: StorePublicProfile | null;
    theme?: Record<string, unknown> | null;
    businessRules?: Record<string, unknown> | null;
    operatingHours?: Record<string, unknown> | null;
    orderLimits?: Record<string, unknown> | null;
  }
): Promise<void> {
  const supabase = getSupabase(env);
  if (payload.displayName !== undefined) {
    const { error: storeErr } = await supabase
      .from("stores")
      .update({
        display_name: payload.displayName ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);
    if (storeErr) throw new Error(storeErr.message);
  }
  if (
    payload.logoUrl !== undefined ||
    payload.primaryColor !== undefined ||
    payload.minimumOrderValue !== undefined ||
    payload.publicProfile !== undefined ||
    payload.theme !== undefined ||
    payload.businessRules !== undefined ||
    payload.operatingHours !== undefined ||
    payload.orderLimits !== undefined
  ) {
    const { data: existing } = await supabase
      .from("store_settings")
      .select("store_id")
      .eq("store_id", storeId)
      .maybeSingle();
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.logoUrl !== undefined) updatePayload.logo_url = payload.logoUrl ?? null;
    if (payload.primaryColor !== undefined) updatePayload.primary_color = payload.primaryColor ?? null;
    if (payload.minimumOrderValue !== undefined)
      updatePayload.minimum_order_value = payload.minimumOrderValue ?? null;
    if (payload.publicProfile !== undefined) {
      updatePayload.public_profile = toPublicProfileJson(
        parsePublicProfile(payload.publicProfile)
      );
    }
    if (payload.theme !== undefined) updatePayload.theme = payload.theme ?? {};
    if (payload.businessRules !== undefined) updatePayload.business_rules = payload.businessRules ?? {};
    if (payload.operatingHours !== undefined) updatePayload.operating_hours = payload.operatingHours ?? {};
    if (payload.orderLimits !== undefined) updatePayload.order_limits = payload.orderLimits ?? {};

    if (existing) {
      const { error: updErr } = await supabase
        .from("store_settings")
        .update(updatePayload)
        .eq("store_id", storeId);
      if (updErr) throw new Error(updErr.message);
    } else {
      const { error: insErr } = await supabase.from("store_settings").insert({
        store_id: storeId,
        logo_url: payload.logoUrl ?? null,
        primary_color: payload.primaryColor ?? null,
        minimum_order_value: payload.minimumOrderValue ?? null,
        public_profile:
          payload.publicProfile !== undefined
            ? toPublicProfileJson(parsePublicProfile(payload.publicProfile))
            : {},
        theme: payload.theme ?? {},
        business_rules: payload.businessRules ?? {},
        operating_hours: payload.operatingHours ?? {},
        order_limits: payload.orderLimits ?? {},
        updated_at: new Date().toISOString(),
      });
      if (insErr) throw new Error(insErr.message);
    }
  }
}
