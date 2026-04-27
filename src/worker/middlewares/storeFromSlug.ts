import type { Context, Next } from "hono";
import { getStoreBySlug } from "../core/database.js";
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
];

export const storeMiddleware = async (
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) => {
  const path = c.req.path;
  if (SKIP_STORE_PATHS.some((p) => path.startsWith(p) || path === p)) {
    return next();
  }

  const storeSlug = c.req.header("x-store-slug");

  if (!storeSlug) {
    return c.json({ success: false, error: "Identificação da loja (x-store-slug) é obrigatória" }, 400);
  }

  let store;
  try {
    store = await getStoreBySlug(c.env, storeSlug);
  } catch (err) {
    console.error("storeMiddleware getStoreBySlug error:", err);
    return c.json({ success: false, error: "Erro ao buscar loja" }, 500);
  }

  if (!store || store.status !== "active") {
    return c.json({ success: false, error: "Loja não encontrada ou inativa" }, 404);
  }

  c.set("store", store);
  await next();
};
