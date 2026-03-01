import { Hono } from "hono";
import { getProductsByStore } from "../core/database.js";
import { Variables } from "../types.js";

const products = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Lista produtos do catálogo da loja atual (isolado por store_id).
 */
products.get("/", async (c) => {
  try {
    const store = c.get("store");
    const data = await getProductsByStore(c.env, store.id);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao buscar produtos";
    console.error("Products fetch error:", err);
    return c.json({ success: false, error: message }, 500);
  }
});

export default products;
