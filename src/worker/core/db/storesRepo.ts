/**
 * Repositório: lojas (tenants) e configurações (store_settings).
 * Toda leitura/escrita de settings é filtrada por store_id.
 */

import { getSupabase } from "../supabase.js";
import { getStoreCapabilities } from "../storeCapabilities.js";
import type { Store, StoreSettings } from "../schema.js";
import {
  parsePublicProfile,
  toPublicProfileJson,
  type StorePublicProfile,
} from "../storePublicProfile.js";
import { rowToStore } from "./mappers.js";

function isMissingStoreDomainsTable(err: unknown): boolean {
  const code = typeof err === "object" && err != null && "code" in err ? String((err as { code?: unknown }).code ?? "") : "";
  const message =
    typeof err === "object" && err != null && "message" in err
      ? String((err as { message?: unknown }).message ?? "")
      : "";
  return code === "42P01" || /store_domains/i.test(message);
}

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

function normalizeHostDomain(raw: string): string {
  return raw.trim().toLowerCase().replace(/\.$/, "");
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
    .select("*")
    .eq("id", storeId)
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
  const [{ data: storeRow, error: storeError }, { data: settingsRow, error: settingsError }] = await Promise.all([
    supabase.from("stores").select("display_name").eq("id", storeId).maybeSingle(),
    supabase
      .from("store_settings")
      .select(
        "logo_url, banner_url, primary_color, minimum_order_value, public_profile, theme, business_rules, operating_hours, order_limits"
      )
      .eq("store_id", storeId)
      .maybeSingle(),
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

/** Upsert de settings e update de stores só no id = storeId. */
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

export type CreatedStoreResult = {
  id: string;
  slug: string;
  displayName: string;
  /** Preenchido quando o vínculo à assinatura da plataforma falhou (loja criada mesmo assim). */
  subscriptionWarning?: string;
};

function slugFromLabel(raw: string, fallback: string): string {
  const base = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || fallback;
}

type SeedCategoryInput = {
  name: string;
  sortOrder: number;
};

type SeedProductInput = {
  categoryName: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: "active" | "inactive";
};

const DEFAULT_ONBOARDING_CATEGORIES: SeedCategoryInput[] = [
  { name: "Destaques", sortOrder: 1 },
  { name: "Mais vendidos", sortOrder: 2 },
  { name: "Novidades", sortOrder: 3 },
];

const DEFAULT_ONBOARDING_PRODUCTS: SeedProductInput[] = [
  {
    categoryName: "Destaques",
    name: "Produto principal",
    description: "Item inicial para editar preço, foto e descrição da sua loja.",
    price: 19.9,
    stock: 25,
    status: "active",
  },
  {
    categoryName: "Mais vendidos",
    name: "Produto premium",
    description: "Exemplo de item premium para montar kits e promoções.",
    price: 29.9,
    stock: 20,
    status: "active",
  },
  {
    categoryName: "Novidades",
    name: "Produto lançamento",
    description: "Use este item para divulgar novidades com destaque na vitrine.",
    price: 24.9,
    stock: 15,
    status: "active",
  },
];

async function seedDefaultCatalog(env: Env, storeId: string): Promise<void> {
  const supabase = getSupabase(env);
  const now = new Date().toISOString();

  const categoryRows = DEFAULT_ONBOARDING_CATEGORIES.map((cat) => ({
    store_id: storeId,
    name: cat.name,
    slug: `${slugFromLabel(cat.name, "categoria")}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 7)}`,
    sort_order: cat.sortOrder,
    metadata: {},
    created_at: now,
    updated_at: now,
  }));

  const { data: insertedCategories, error: categoryErr } = await supabase
    .from("categories")
    .insert(categoryRows)
    .select("id, name");
  if (categoryErr) throw new Error(categoryErr.message);

  const byName = new Map<string, string>();
  for (const c of insertedCategories ?? []) {
    byName.set(String(c.name), String(c.id));
  }

  const productRows = DEFAULT_ONBOARDING_PRODUCTS.map((p) => ({
    store_id: storeId,
    category_id: byName.get(p.categoryName) ?? null,
    name: p.name,
    slug: `${slugFromLabel(p.name, "produto")}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 7)}`,
    description: p.description,
    price: p.price,
    stock: p.stock,
    status: p.status,
    image_url: null,
    metadata: { seeded: true },
    created_at: now,
    updated_at: now,
  }));

  const { error: productErr } = await supabase.from("products").insert(productRows);
  if (productErr) throw new Error(productErr.message);
}

function normalizeDomain(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "").replace(/\.$/, "");
}

type StoreDomainInsert = {
  store_id: string;
  domain: string;
  status: "active" | "pending_verification" | "disabled";
  is_primary: boolean;
};

async function addStoreDomains(
  env: Env,
  storeId: string,
  domains: string[]
): Promise<void> {
  if (domains.length === 0) return;
  const supabase = getSupabase(env);
  const rows: StoreDomainInsert[] = [];
  const uniq = [...new Set(domains.map((d) => normalizeDomain(d)).filter(Boolean))];
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

  const uniq = [...new Set(params.domains.map((d) => normalizeDomain(d)).filter(Boolean))];
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
 * Nova loja SaaS: `stores` + `store_settings` padrão + `store_members` como owner.
 * `planDefinitionSlug` (ex.: tier_base): cria assinatura na plataforma quando o catálogo de planos existir.
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
    await supabase.from("stores").delete().eq("id", storeId); /* CASCADE remove store_settings */
    throw new Error(memErr.message);
  }

  try {
    await seedDefaultCatalog(env, storeId);
    await addStoreDomains(env, storeId, params.customDomains ?? []);
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

export type PlatformStoreOverview = {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  createdAt: string;
  domains: { domain: string; status: string; isPrimary: boolean }[];
};

export async function listPlatformStores(env: Env): Promise<PlatformStoreOverview[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("stores")
    .select("id, slug, display_name, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  const stores = rows ?? [];
  if (stores.length === 0) return [];

  const ids = stores.map((s) => String(s.id));
  const { data: domainRows, error: domainErr } = await supabase
    .from("store_domains")
    .select("store_id, domain, status, is_primary")
    .in("store_id", ids)
    .order("is_primary", { ascending: false });
  if (domainErr && !isMissingStoreDomainsTable(domainErr)) throw new Error(domainErr.message);

  const domainsByStore = new Map<string, { domain: string; status: string; isPrimary: boolean }[]>();
  for (const row of domainRows ?? []) {
    const key = String(row.store_id);
    const list = domainsByStore.get(key) ?? [];
    list.push({
      domain: String(row.domain ?? ""),
      status: String(row.status ?? ""),
      isPrimary: row.is_primary === true,
    });
    domainsByStore.set(key, list);
  }

  return stores.map((row) => ({
    id: String(row.id),
    slug: String(row.slug ?? ""),
    displayName: String(row.display_name ?? ""),
    status: String(row.status ?? ""),
    createdAt: String(row.created_at ?? ""),
    domains: domainsByStore.get(String(row.id)) ?? [],
  }));
}
