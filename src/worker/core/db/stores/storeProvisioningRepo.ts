/**
 * **Criação de loja** (onboarding SaaS): `stores`, `store_settings`, membro owner, seed de catálogo, domínios opcionais e assinatura de plano.
 *
 * Por que não ficar no mesmo ficheiro que `getStoreBySlug`?
 * - Fluxo transacional longo com compensação (`delete` da loja se seed falhar) — é outro “subdomínio” de negócio.
 * - Daqui a 6 meses, quando mudar só a regra de trial/planos, abre-se **só** este ficheiro (ou o helper de subscription abaixo).
 */

import { getSupabase } from "../../supabase.js";
import { parsePublicProfile, toPublicProfileJson } from "../../storePublicProfile.js";
import { seedDefaultCatalog } from "./storeOnboardingSeed.js";
import { isMissingStoreDomainsTable, normalizeStoreDomainInput } from "./storeDomainHelpers.js";

export type CreatedStoreResult = {
  id: string;
  slug: string;
  displayName: string;
  /** Preenchido quando o vínculo à assinatura da plataforma falhou (loja criada mesmo assim). */
  subscriptionWarning?: string;
};

/**
 * Para que serve: garantir slug único e seguro na URL (`/loja/:slug` ou subdomínio).
 * A cadeia `.normalize("NFD").replace(/\p{Diacritic}/gu, "")`: remove acentos para `São-Paulo` → `sao-paulo`.
 */
function normalizeStoreSlug(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s;
}

type StoreDomainInsert = {
  store_id: string;
  domain: string;
  status: "active" | "pending_verification" | "disabled";
  is_primary: boolean;
};

/**
 * Para que serve: na criação inicial da loja, inserir **vários** domínios de uma vez (sem upsert — primeira inserção).
 * Diferente de `addDomainsToStore` no `storeWriteRepo`: aqui usamos `insert` simples porque sabemos que a loja acabou de nascer.
 */
async function addStoreDomainsOnCreate(env: Env, storeId: string, domains: string[]): Promise<void> {
  if (domains.length === 0) return;
  const supabase = getSupabase(env);
  const rows: StoreDomainInsert[] = [];
  const uniq = [...new Set(domains.map((d) => normalizeStoreDomainInput(d)).filter(Boolean))];
  uniq.forEach((domain, idx) => {
    rows.push({
      store_id: storeId,
      domain,
      status: "active",
      is_primary: idx === 0,
    });
  });
  if (rows.length === 0) return;
  const { error } = await supabase.from("store_domains").insert(rows);
  if (error) {
    if (isMissingStoreDomainsTable(error)) return;
    throw new Error(error.message);
  }
}

/**
 * Para que serve: após criar a loja, ligar ao **plano base** da plataforma (`platform_plan_definitions` + versão de preço).
 * O bloco `trialDays > 0 ? …`: se o plano tiver trial, `lifecycle_status` fica `trialing` e datas de faturação ficam nulas até o fim do trial.
 */
async function attachDefaultPlatformSubscription(
  env: Env,
  storeId: string,
  planDefinitionSlug: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = getSupabase(env);
  const { data: def, error: defErr } = await supabase
    .from("platform_plan_definitions")
    .select("id")
    .eq("slug", planDefinitionSlug)
    .maybeSingle();
  if (defErr) return { ok: false, message: defErr.message };
  if (!def) return { ok: false, message: `PLAN_SLUG_NOT_FOUND:${planDefinitionSlug}` };

  const { data: ver, error: verErr } = await supabase
    .from("platform_plan_price_versions")
    .select("id, trial_period_days")
    .eq("plan_definition_id", def.id)
    .eq("version_seq", 1)
    .maybeSingle();
  if (verErr) return { ok: false, message: verErr.message };
  if (!ver) return { ok: false, message: "PLAN_VERSION_NOT_FOUND" };

  const trialDays = Math.max(0, Math.min(365, Math.trunc(Number(ver.trial_period_days ?? 0))));
  const now = new Date();
  const startedAt = now.toISOString();
  const trialEndsAt =
    trialDays > 0 ? new Date(now.getTime() + trialDays * 86400000).toISOString() : null;
  const isTrialing = trialDays > 0;

  let currentPeriodStart: string | null = null;
  let currentPeriodEnd: string | null = null;
  if (!isTrialing) {
    currentPeriodStart = startedAt;
    const end = new Date(now.getTime());
    end.setUTCMonth(end.getUTCMonth() + 1);
    currentPeriodEnd = end.toISOString();
  }

  const { error: insErr } = await supabase.from("platform_store_subscriptions").insert({
    store_id: storeId,
    plan_price_version_id: ver.id,
    lifecycle_status: isTrialing ? "trialing" : "active",
    started_at: startedAt,
    ended_at: null,
    trial_ends_at: trialEndsAt,
    current_period_start_at: currentPeriodStart,
    current_period_end_at: currentPeriodEnd,
  });
  if (insErr) return { ok: false, message: insErr.message };
  return { ok: true };
}

/**
 * Para que serve: transação de negócio “nova loja SaaS” — várias tabelas com **rollback manual** se passos posteriores falharem.
 * A ordem importa: primeiro `stores`, depois settings (FK), depois `store_members`, só então seed/domínios (podem falhar por dados inválidos).
 */
export async function createStoreWithOwner(
  env: Env,
  params: {
    slug: string;
    displayName: string;
    ownerUserId: string;
    customDomains?: string[];
    planDefinitionSlug?: string | null;
  }
): Promise<CreatedStoreResult> {
  const supabase = getSupabase(env);
  const slug = normalizeStoreSlug(params.slug);
  if (slug.length < 2) {
    throw new Error("Slug inválido: use ao menos 2 caracteres (letras, números ou hífen).");
  }

  const { data: dup, error: dupErr } = await supabase.from("stores").select("id").eq("slug", slug).maybeSingle();
  if (dupErr) throw new Error(dupErr.message);
  if (dup) throw new Error("DUPLICATE_SLUG");

  const displayName = params.displayName.trim();
  if (displayName.length < 2) {
    throw new Error("Nome da loja muito curto.");
  }

  const { data: storeRow, error: insStore } = await supabase
    .from("stores")
    .insert({
      slug,
      display_name: displayName,
      status: "active",
    })
    .select("id, slug, display_name")
    .single();

  if (insStore || !storeRow) {
    throw new Error(insStore?.message ?? "Falha ao criar loja");
  }

  const storeId = String(storeRow.id);

  const { error: setErr } = await supabase.from("store_settings").insert({
    store_id: storeId,
    logo_url: null,
    primary_color: "#1B4332",
    minimum_order_value: null,
    public_profile: toPublicProfileJson(parsePublicProfile({})),
    theme: {},
    business_rules: {},
    operating_hours: {
      timezone: "America/Manaus",
      weekdays: "Segunda a sexta, 9h–18h",
      saturday: "Sábado, 9h–13h",
      sunday: "Fechado",
    },
    order_limits: {},
    updated_at: new Date().toISOString(),
  });

  if (setErr) {
    await supabase.from("stores").delete().eq("id", storeId);
    throw new Error(setErr.message);
  }

  const { error: memErr } = await supabase.from("store_members").insert({
    store_id: storeId,
    user_id: params.ownerUserId,
    role: "owner",
  });

  if (memErr) {
    await supabase.from("stores").delete().eq("id", storeId);
    throw new Error(memErr.message);
  }

  try {
    await seedDefaultCatalog(env, storeId);
    await addStoreDomainsOnCreate(env, storeId, params.customDomains ?? []);
  } catch (err) {
    await supabase.from("stores").delete().eq("id", storeId);
    throw err instanceof Error ? err : new Error("Falha ao preparar loja inicial.");
  }

  let subscriptionWarning: string | undefined;
  const planSlug = params.planDefinitionSlug?.trim();
  if (planSlug) {
    const sub = await attachDefaultPlatformSubscription(env, storeId, planSlug);
    if (!sub.ok) subscriptionWarning = sub.message;
  }

  return {
    id: storeId,
    slug: String(storeRow.slug),
    displayName: String(storeRow.display_name),
    ...(subscriptionWarning ? { subscriptionWarning } : {}),
  };
}
