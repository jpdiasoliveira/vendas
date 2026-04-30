import type { Context } from "hono";
import type { Store } from "../../contracts/schema.js";
import type { Variables } from "../types.js";

/**
 * Rotas sob storeMiddleware devem ter loja; plataforma (/api/platform) não passa por aqui.
 */
export function requireStoreContext(
  c: Context<{ Bindings: Env; Variables: Variables }>
): Store | Response {
  const store = c.get("store");
  if (!store) {
    return c.json(
      { success: false, error: "Identificação da loja (x-store-slug) é obrigatória" },
      400
    );
  }
  return store;
}
