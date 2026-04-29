import type { Context, Next } from "hono";
import { getStoreByDomain, getStoreBySlug } from "../core/database.js";
import type { Variables } from "../types.js";

/**
 * Middleware de isolamento por loja (tenant): lê `x-store-slug`, busca a loja ativa no Supabase
 * e coloca o registo em `c.set("store", ...)`.
 */
const SKIP_STORE_PATHS = [
  "/api/webhooks",
  "/api/oauth",
  "/api/sessions",
  "/api/users",
  "/api/logout",
  "/api/login",
  "/api/health",
  "/api/platform",
  "/api/me",
];

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function sanitizeSlug(raw: string | null | undefined): string {
  return (raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseHostFromRequest(c: Context<{ Bindings: Env; Variables: Variables }>): string {
  const forwarded = c.req.header("x-forwarded-host");
  const hostHeader = (forwarded ?? c.req.header("host") ?? "").trim().toLowerCase();
  return hostHeader.split(",")[0]?.trim().split(":")[0] ?? "";
}

function inferStoreSlugFromHost(host: string): string {
  if (!host || LOCAL_HOSTS.has(host)) return "";
  const parts = host.split(".").filter(Boolean);
  if (parts.length < 3) return "";
  return sanitizeSlug(parts[0]);
}

function resolveStoreSlug(c: Context<{ Bindings: Env; Variables: Variables }>): string {
  const fromHeader = sanitizeSlug(c.req.header("x-store-slug"));
  if (fromHeader) return fromHeader;
  const host = parseHostFromRequest(c);
  const fromHost = inferStoreSlugFromHost(host);
  if (fromHost) return fromHost;
  return "";
}

export const storeMiddleware = async (
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) => {
  const path = c.req.path;
  if (SKIP_STORE_PATHS.some((p) => path.startsWith(p) || path === p)) {
    return next();
  }

  const storeSlug = resolveStoreSlug(c);
  const requestHost = parseHostFromRequest(c);

  const hostIsLocal = requestHost ? LOCAL_HOSTS.has(requestHost) : false;

  /* Em localhost o header Host não identifica tenant; sem x-store-slug não há loja. */
  if (!storeSlug && (!requestHost || hostIsLocal)) {
    return c.json(
      {
        success: false,
        error:
          "Não foi possível identificar a loja. Em desenvolvimento (localhost): envie x-store-slug, defina VITE_DEFAULT_STORE_SLUG no Vite ou use o override no navegador. Em produção: subdomínio, domínio mapeado ou x-store-slug.",
      },
      400
    );
  }

  let store;
  try {
    const hostForLookup = requestHost && !hostIsLocal ? requestHost : "";
    if (hostForLookup) {
      store = await getStoreByDomain(c.env, hostForLookup);
    }
    if (!store && storeSlug) {
      store = await getStoreBySlug(c.env, storeSlug);
    }
  } catch (err) {
    console.error("storeMiddleware resolve store error:", err);
    return c.json({ success: false, error: "Erro ao buscar loja" }, 500);
  }

  if (!store || store.status !== "active") {
    return c.json({ success: false, error: "Loja não encontrada ou inativa" }, 404);
  }

  c.set("store", store);
  await next();
};
