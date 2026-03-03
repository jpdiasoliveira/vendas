import type { Context, Next } from "hono";
import { getStoreBySlug } from "../core/database.js";
import type { Variables } from "../types.js";

/**
 * Middleware SaaS de isolamento dinâmico (Tenant Id).
 * Valida o slug no Supabase (stores com status = 'active') e injeta a loja no contexto.
 */
/** Rotas que não exigem loja (auth Mocha, webhooks, login admin). */
const SKIP_STORE_PATHS = [
  "/api/webhooks",
  "/api/oauth",
  "/api/sessions",
  "/api/users",
  "/api/logout",
  "/api/login",
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
