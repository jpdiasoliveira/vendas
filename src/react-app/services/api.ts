/**
 * Cliente HTTP da aplicação: base em VITE_API_URL, envia x-store-slug
 * e normaliza respostas no formato { success, data?, error? }.
 * Usado por hooks e componentes para chamadas à API do Worker.
 */

import { getAccessToken } from "@/react-app/services/authSession";
import { queryClient } from "@/react-app/query/queryClient";
import { adminMeQueryKey, storeSettingsQueryKey } from "@/react-app/query/queryKeys";

const PLATFORM_CREATE_SECRET = import.meta.env.VITE_PLATFORM_CREATE_STORE_SECRET ?? "";
const STORE_OVERRIDE_KEY = "saas_store_slug_override";
const API_BASE = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function normalizeSlug(raw: string | null | undefined): string {
  return (raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function inferStoreSlugFromHostname(hostname: string): string {
  const host = hostname.trim().toLowerCase();
  if (!host || LOCAL_HOSTS.has(host)) return "";
  const parts = host.split(".").filter(Boolean);
  if (parts.length < 3) return "";
  return normalizeSlug(parts[0]);
}

/** Slug da vitrine/admin: override local tem prioridade; fallback automático por subdomínio; em localhost opcional VITE_DEFAULT_STORE_SLUG. */
export function getEffectiveStoreSlug(): string {
  if (typeof window !== "undefined") {
    try {
      const o = normalizeSlug(localStorage.getItem(STORE_OVERRIDE_KEY));
      if (o) return o;
    } catch {
      /* ignore */
    }
    const fromHost = inferStoreSlugFromHostname(window.location.hostname);
    if (fromHost) return fromHost;
    const host = window.location.hostname.trim().toLowerCase();
    if (LOCAL_HOSTS.has(host)) {
      const devDefault = normalizeSlug(import.meta.env.VITE_DEFAULT_STORE_SLUG ?? "");
      if (devDefault) return devDefault;
    }
  }
  return "";
}

export function setStoreSlugOverride(slug: string): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeSlug(slug);
  if (!normalized) return;
  localStorage.setItem(STORE_OVERRIDE_KEY, normalized);
  void queryClient.invalidateQueries({ queryKey: storeSettingsQueryKey });
  void queryClient.invalidateQueries({ queryKey: adminMeQueryKey });
  void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
  void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
  void queryClient.invalidateQueries({ queryKey: ["admin", "store-settings-form"] });
}

export function clearStoreSlugOverride(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORE_OVERRIDE_KEY);
  void queryClient.invalidateQueries({ queryKey: storeSettingsQueryKey });
  void queryClient.invalidateQueries({ queryKey: adminMeQueryKey });
  void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
  void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
  void queryClient.invalidateQueries({ queryKey: ["admin", "store-settings-form"] });
}

export function getStoreSlugOverride(): string | null {
  if (typeof window === "undefined") return null;
  const value = normalizeSlug(localStorage.getItem(STORE_OVERRIDE_KEY));
  return value || null;
}

export type StaffStoreMembershipClient = {
  storeId: string;
  slug: string;
  role: string;
};

/**
 * Lojas em que a sessão atual tem papel de equipa (sem `x-store-slug`).
 * Usado após login para alinhar o tenant em localhost (evita `VITE_DEFAULT_STORE_SLUG` errado).
 */
export async function fetchMyStaffStores(): Promise<StaffStoreMembershipClient[]> {
  const url = buildApiUrl("/api/me/staff-stores");
  const token = await getAccessToken();
  if (!token) return [];
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  const response = await fetchOrNetworkError(url, { headers, cache: "no-store" });
  const body = await parseJsonOrThrow(response);
  if (!response.ok) return [];
  const b = body as { success?: boolean; data?: { stores?: StaffStoreMembershipClient[] } };
  if (b.success !== true || !Array.isArray(b.data?.stores)) return [];
  return b.data.stores;
}

/**
 * Se o slug efetivo (override, host ou `VITE_DEFAULT_STORE_SLUG`) não for uma loja do utilizador,
 * grava override para a primeira loja em que é `owner`, senão a primeira da lista.
 */
export function syncStaffStoreSlugAfterLogin(stores: StaffStoreMembershipClient[]): void {
  if (typeof window === "undefined" || stores.length === 0) return;
  const slugSet = new Set(stores.map((s) => normalizeSlug(s.slug)));
  const effective = normalizeSlug(getEffectiveStoreSlug());
  if (effective && slugSet.has(effective)) return;
  const ownerFirst =
    stores.find((s) => s.role.trim().toLowerCase() === "owner") ?? stores[0];
  if (ownerFirst?.slug) setStoreSlugOverride(ownerFirst.slug);
}

/** Monta a URL absoluta do endpoint (respeitando proxy em dev). */
function buildApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}

/**
 * Lê o body da resposta como texto e faz parse JSON.
 * Em caso de HTML ou JSON inválido, loga o nome da função e relança.
 */
async function parseJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trimStart().toLowerCase().startsWith("<!doctype")) {
    console.error("[api.parseJsonOrThrow] Resposta foi HTML em vez de JSON. URL:", response.url);
    throw new Error(
      "Resposta inválida (HTML). Verifique: Worker rodando (wrangler dev) e proxy no vite.config para /api."
    );
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("[api.parseJsonOrThrow] Falha ao fazer parse do JSON:", text.slice(0, 200), e);
    throw new Error("Resposta da API não é JSON válido.");
  }
}

/** fetch com mensagem em português quando a rede cai ou o servidor não responde. */
async function fetchOrNetworkError(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const lower = msg.toLowerCase();
    if (
      lower.includes("failed to fetch") ||
      lower.includes("networkerror") ||
      lower.includes("load failed") ||
      lower.includes("network request failed")
    ) {
      throw new Error(
        "Não foi possível conectar ao servidor. Verifique sua internet, se a API está no ar (em dev: wrangler dev + proxy /api) e o domínio da loja."
      );
    }
    throw new Error(`Falha de rede: ${msg}`);
  }
}

/**
 * Requisição autenticada apenas por store (x-store-slug). Para rotas públicas e usuário loja.
 * Retorna data quando success === true; caso contrário lança com mensagem de error.
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const storeSlug = getEffectiveStoreSlug();
  if (storeSlug) headers.set("x-store-slug", storeSlug);

  /** POST /api/login é público: não envia Bearer. Token vem de authSession (sem ciclo com api). */
  if (!/\/api\/login(\?|$)/.test(endpoint)) {
    const token = await getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  /** Evita cache HTTP de listagens (ex.: produtos após mudar destaque na home). */
  const response = await fetchOrNetworkError(url, { ...options, headers, cache: options.cache ?? "no-store" });
  const body = await parseJsonOrThrow(response);

  if (!response.ok) {
    const message = (body as { error?: string })?.error || `Erro na requisição: ${response.status}`;
    console.error("[api.apiFetch] Requisição falhou:", endpoint, response.status, message);
    throw new Error(message);
  }

  const b = body as { success?: boolean; data?: T; error?: string };
  if (body && typeof body === "object" && b.success === false) {
    throw new Error(b.error || "Erro desconhecido");
  }
  if (body && typeof body === "object" && b.success === true && "data" in body) {
    return b.data as T;
  }
  return body as T;
}

/**
 * Upload de imagem para POST /api/admin/upload (multipart/form-data).
 * Retorna a publicUrl da imagem no Supabase Storage. Exige admin logado.
 */
export async function adminUploadImage(file: File): Promise<{ publicUrl: string }> {
  const url = buildApiUrl("/api/admin/upload");
  const token = await getAccessToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers = new Headers();
  const storeSlug = getEffectiveStoreSlug();
  if (storeSlug) headers.set("x-store-slug", storeSlug);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetchOrNetworkError(url, { method: "POST", headers, body: formData });
  const body = await parseJsonOrThrow(response);

  if (response.status === 401 || response.status === 403) {
    const msg = (body as { error?: string })?.error || "Não autorizado";
    try {
      sessionStorage.setItem("lastAuthError", JSON.stringify({ status: response.status, error: msg }));
    } catch {
      /* ignore */
    }
    if (response.status === 401 && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    console.error("[api.adminUploadImage] Não autorizado:", response.status, msg);
    throw new Error(msg);
  }
  if (!response.ok) {
    const message = (body as { error?: string })?.error || `Erro no upload: ${response.status}`;
    console.error("[api.adminUploadImage] Upload falhou:", response.status, message);
    throw new Error(message);
  }
  const b = body as { success?: boolean; publicUrl?: string; error?: string };
  if (b.success === true && typeof b.publicUrl === "string") {
    return { publicUrl: b.publicUrl };
  }
  throw new Error((b as { error?: string })?.error || "Resposta inválida do upload.");
}

/**
 * Cliente HTTP para rotas /api/admin/*: envia x-store-slug e Authorization Bearer.
 * Use nas páginas do painel admin (requer usuário logado).
 */
export async function adminApiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);
  const token = await getAccessToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const storeSlug = getEffectiveStoreSlug();
  if (storeSlug) headers.set("x-store-slug", storeSlug);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetchOrNetworkError(url, { ...options, headers, cache: options.cache ?? "no-store" });
  const body = await parseJsonOrThrow(response);

  if (response.status === 401) {
    const msg = (body as { error?: string })?.error || "Não autorizado";
    try {
      sessionStorage.setItem("lastAuthError", JSON.stringify({ status: 401, error: msg }));
    } catch {
      /* ignore */
    }
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    console.error("[api.adminApiFetch] 401 em:", endpoint, msg);
    throw new Error(msg);
  }
  if (response.status === 403) {
    const msg = (body as { error?: string })?.error || "Acesso negado";
    try {
      sessionStorage.setItem("lastAuthError", JSON.stringify({ status: 403, error: msg }));
    } catch {
      /* ignore */
    }
    console.error("[api.adminApiFetch] 403 em:", endpoint, msg);
    throw new Error(msg);
  }

  if (!response.ok) {
    const message = (body as { error?: string })?.error || `Erro na requisição: ${response.status}`;
    console.error("[api.adminApiFetch] Falha em:", endpoint, response.status, message);
    const err = new Error(message) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  const b = body as { success?: boolean; data?: T; error?: string };
  if (body && typeof body === "object" && b.success === false) {
    throw new Error(b.error || "Erro desconhecido");
  }
  if (body && typeof body === "object" && b.success === true && "data" in body) {
    return b.data as T;
  }
  return body as T;
}

export type CreatedPlatformStore = {
  id: string;
  slug: string;
  displayName: string;
  subscriptionWarning?: string;
};

export type PlatformAnalyticsOverviewDto = {
  mrrBrlEstimated: number;
  payingOrTrialingSubscriptions: number;
  activeStoresCount: number;
  gmvPaidBrlLast30d: number;
};

export type PlatformStoreRankingRowDto = {
  storeId: string;
  slug: string;
  displayName: string;
  storeStatus: string;
  gmvPaidBrlLast30d: number;
  paidOrdersLast30d: number;
  allOrdersLast30d: number;
};
export type PlatformStoreOverview = {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  createdAt: string;
  ownerEmail: string;
  domains: { domain: string; status: string; isPrimary: boolean }[];
};

export type PlatformNewStoresWeekBucketDto = {
  weekStartIso: string;
  label: string;
  count: number;
};

export type PlatformCatalogFeatureDto = {
  id: string;
  code: string;
  displayName: string;
  description: string | null;
  valueKind: "integer" | "boolean";
  sortOrder: number;
};

export type PlatformCatalogEntitlementDto = {
  featureId: string;
  featureCode: string;
  intValue: number | null;
  boolValue: boolean | null;
};

export type PlatformCatalogPlanDto = {
  planDefinitionId: string;
  slug: string;
  displayName: string;
  sortOrder: number;
  publicPriceVersion: {
    id: string;
    versionSeq: number;
    trialPeriodDays: number;
  } | null;
  entitlements: PlatformCatalogEntitlementDto[];
};

export type PlatformPlansCatalogDto = {
  features: PlatformCatalogFeatureDto[];
  plans: PlatformCatalogPlanDto[];
};

export type PlatformEntitlementWriteRow = {
  featureId: string;
  intValue?: number | null;
  boolValue?: boolean | null;
};

/**
 * Rotas `/api/platform/*`: sem `x-store-slug`; JWT + lista PLATFORM_OPERATOR_EMAILS no Worker.
 * Se o Worker tiver `PLATFORM_CREATE_STORE_SECRET`, defina `VITE_PLATFORM_CREATE_STORE_SECRET` igual.
 */
export async function platformApiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);
  const token = await getAccessToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (PLATFORM_CREATE_SECRET.trim()) {
    headers.set("x-platform-create-store-secret", PLATFORM_CREATE_SECRET.trim());
  }

  const response = await fetchOrNetworkError(url, { ...options, headers });
  const body = await parseJsonOrThrow(response);

  if (response.status === 401) {
    const msg = (body as { error?: string })?.error || "Não autorizado";
    console.error("[api.platformApiFetch] 401 em:", endpoint, msg);
    throw new Error(msg);
  }
  if (response.status === 403 || response.status === 503) {
    const msg = (body as { error?: string })?.error || "Acesso à plataforma negado";
    console.error("[api.platformApiFetch]", response.status, endpoint, msg);
    throw new Error(msg);
  }

  if (!response.ok) {
    const message = (body as { error?: string })?.error || `Erro na requisição: ${response.status}`;
    console.error("[api.platformApiFetch] Falha em:", endpoint, response.status, message);
    throw new Error(message);
  }

  const b = body as { success?: boolean; data?: T; error?: string };
  if (body && typeof body === "object" && b.success === false) {
    throw new Error(b.error || "Erro desconhecido");
  }
  if (body && typeof body === "object" && b.success === true && "data" in body) {
    return b.data as T;
  }
  return body as T;
}
