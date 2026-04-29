/**
 * Leituras de **tenant** (`stores`) e **configuração pública** (`store_settings` + capabilities).
 *
 * Separação face ao ficheiro monolítico anterior:
 * - Aqui só existem **SELECT** e montagem de DTOs — quem procura bug de “loja não carrega” abre só este ficheiro.
 * - Escritas (`updateStoreSettings…`, criação de loja) vivem noutros módulos: menos conflitos de merge e menos risco de alterar leitura ao mudar onboarding.
 */

import { getSupabase } from "../../supabase.js";
import { getStoreCapabilities } from "../../storeCapabilities.js";
import type { Store, StoreSettings } from "../../schema.js";
import { parsePublicProfile } from "../../storePublicProfile.js";
import { rowToStore } from "../mappers.js";
import { isMissingStoreDomainsTable } from "./storeDomainHelpers.js";

/** Colunas usadas por `rowToStore` — evita `select('*')` na resolução de tenant. */
const STORE_ROW_SELECT = "id, slug, display_name, status, created_at, updated_at";

/** Colunas de `store_settings` necessárias à vitrine + admin (alinhado ao tipo `StoreSettings`). */
const STORE_SETTINGS_ROW_SELECT =
  "logo_url, banner_url, primary_color, minimum_order_value, public_profile, theme, business_rules, operating_hours, order_limits";

/**
 * Para que serve: normalizar o **Host** HTTP (ex.: `WWW.Loja.PT.`) para comparação com linhas em `store_domains`.
 * Diferente de `normalizeStoreDomainInput`: aqui não removemos `https://` porque o middleware já envia host, não URL completa.
 */
function normalizeHostDomain(raw: string): string {
  return raw.trim().toLowerCase().replace(/\.$/, "");
}

/** Loja ativa por slug (tenant resolvido pelo middleware x-store-slug). */
export async function getStoreBySlug(env: Env, slug: string): Promise<Store | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("stores")
    .select(STORE_ROW_SELECT)
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) return null;

  return rowToStore(row as Record<string, unknown>);
}

/** Loja ativa por domínio completo (ex.: lojaexemplo.com.br). */
export async function getStoreByDomain(env: Env, domain: string): Promise<Store | null> {
  const supabase = getSupabase(env);
  const normalized = normalizeHostDomain(domain);
  if (!normalized) return null;

  const candidates = new Set<string>([normalized]);
  if (normalized.startsWith("www.")) candidates.add(normalized.slice(4));

  const { data: domainRows, error: domainErr } = await supabase
    .from("store_domains")
    .select("store_id, domain, status")
    .in("domain", [...candidates])
    .eq("status", "active")
    .limit(5);
  if (domainErr) {
    if (isMissingStoreDomainsTable(domainErr)) return null;
    throw new Error(domainErr.message);
  }
  if (!domainRows || domainRows.length === 0) return null;

  const preferred =
    domainRows.find((r) => String(r.domain).toLowerCase() === normalized) ?? domainRows[0];
  const storeId = String(preferred.store_id ?? "").trim();
  if (!storeId) return null;

  const { data: row, error } = await supabase
    .from("stores")
    .select(STORE_ROW_SELECT)
    .eq("id", storeId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;
  return rowToStore(row as Record<string, unknown>);
}

/**
 * Para que serve: devolver o pacote completo de identidade da loja para a vitrine e o checkout (`GET /api/store/settings`).
 * O que faz `Promise.all`: lê `display_name` em `stores` e JSON de settings em paralelo — uma ida à rede em vez de duas sequenciais.
 */
export async function getStoreSettingsWithDisplayName(env: Env, storeId: string): Promise<StoreSettings> {
  const supabase = getSupabase(env);
  const [{ data: storeRow, error: storeError }, { data: settingsRow, error: settingsError }] = await Promise.all([
    supabase.from("stores").select("display_name").eq("id", storeId).maybeSingle(),
    supabase.from("store_settings").select(STORE_SETTINGS_ROW_SELECT).eq("store_id", storeId).maybeSingle(),
  ]);
  if (storeError) throw new Error(storeError.message);
  if (settingsError) throw new Error(settingsError.message);

  let capabilities: Awaited<ReturnType<typeof getStoreCapabilities>> | undefined;
  try {
    capabilities = await getStoreCapabilities(env, storeId);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[getStoreSettingsWithDisplayName] Falha ao resolver capabilities:", msg);
  }

  return {
    displayName: (storeRow?.display_name as string) ?? "",
    logoUrl: settingsRow?.logo_url ?? null,
    bannerUrl: (() => {
      const br = (settingsRow as Record<string, unknown> | null)?.banner_url;
      return typeof br === "string" && br.trim() !== "" ? br.trim() : null;
    })(),
    primaryColor: settingsRow?.primary_color ?? null,
    minimumOrderValue:
      settingsRow?.minimum_order_value != null ? Number(settingsRow.minimum_order_value) : null,
    publicProfile: parsePublicProfile(settingsRow?.public_profile),
    theme: (settingsRow?.theme as Record<string, unknown> | null) ?? null,
    businessRules: (settingsRow?.business_rules as Record<string, unknown> | null) ?? null,
    operatingHours: (settingsRow?.operating_hours as Record<string, unknown> | null) ?? null,
    orderLimits: (settingsRow?.order_limits as Record<string, unknown> | null) ?? null,
    capabilities,
  };
}
