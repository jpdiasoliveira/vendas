import { Hono } from "hono";
import { getStoreSettingsWithDisplayName } from "../core/database.js";
import type { Variables } from "../types.js";

/**
 * Rotas públicas da loja (exigem x-store-slug via storeMiddleware).
 * GET /api/store/settings: vitrine e carrinho (nome, logo, cor, valor mínimo, public_profile).
 */
const store = new Hono<{ Bindings: Env; Variables: Variables }>();

store.get("/settings", async (c) => {
  const store = c.get("store");
  try {
    const data = await getStoreSettingsWithDisplayName(c.env, store.id);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao carregar configurações";
    return c.json({ success: false, error: message }, 500);
  }
});

export default store;
