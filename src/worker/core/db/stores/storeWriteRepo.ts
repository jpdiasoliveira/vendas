/**
 * Escritas em **configuração da loja** (`stores.display_name`, `store_settings`) e **domínios** (`store_domains`).
 *
 * Por que separado de `storeReadRepo`?
 * - Leitura e escrita têm ritmos diferentes (cache, RLS, auditoria) e equipas diferentes costumam tocá-las.
 * - Reduz a superfície mental: alterar upsert de settings não exige reler 400 linhas de onboarding/plataforma.
 */

import { getSupabase } from "../../supabase.js";
import {
  parsePublicProfile,
  toPublicProfileJson,
  type StorePublicProfile,
} from "../../../../contracts/storePublicProfile.js";
import { isMissingStoreDomainsTable, normalizeStoreDomainInput } from "./storeDomainHelpers.js";

/**
 * Para que serve: persistir alterações feitas no painel “Configurações da loja” (nome, cores, JSON público, etc.).
 * O bloco `if (existing) update else insert`: **upsert manual** porque nem sempre existe linha em `store_settings` para lojas antigas.
 */
export async function updateStoreSettingsAndDisplayName(
  env: Env,
  storeId: string,
  payload: {
    displayName?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
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
    payload.bannerUrl !== undefined ||
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
    if (payload.bannerUrl !== undefined) updatePayload.banner_url = payload.bannerUrl ?? null;
    if (payload.primaryColor !== undefined) updatePayload.primary_color = payload.primaryColor ?? null;
    if (payload.minimumOrderValue !== undefined)
      updatePayload.minimum_order_value = payload.minimumOrderValue ?? null;
    if (payload.publicProfile !== undefined) {
      updatePayload.public_profile = toPublicProfileJson(parsePublicProfile(payload.publicProfile));
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
        banner_url: payload.bannerUrl ?? null,
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

/**
 * Para que serve: expor ao operador da plataforma uma forma idempotente de associar domínios a uma loja já existente.
 * `upsert` com `onConflict: "domain"`: se o domínio já existir noutra loja, o Postgres aplica a regra da unique constraint (pode falhar — esperado).
 */
export async function addDomainsToStore(
  env: Env,
  params: { storeId: string; domains: string[]; setPrimaryFirst?: boolean }
): Promise<void> {
  const supabase = getSupabase(env);
  const { data: store, error: storeErr } = await supabase
    .from("stores")
    .select("id")
    .eq("id", params.storeId)
    .maybeSingle();
  if (storeErr) throw new Error(storeErr.message);
  if (!store) throw new Error("STORE_NOT_FOUND");

  const uniq = [...new Set(params.domains.map((d) => normalizeStoreDomainInput(d)).filter(Boolean))];
  if (uniq.length === 0) return;
  const rows = uniq.map((domain, idx) => ({
    store_id: params.storeId,
    domain,
    status: "active" as const,
    is_primary: params.setPrimaryFirst === true && idx === 0,
  }));
  const { error } = await supabase
    .from("store_domains")
    .upsert(rows, { onConflict: "domain", ignoreDuplicates: false });
  if (error) {
    if (isMissingStoreDomainsTable(error)) return;
    throw new Error(error.message);
  }
}
