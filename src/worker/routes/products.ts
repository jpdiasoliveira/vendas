import { Hono } from "hono";
import { getProductsByStore, getTrendingProductIds } from "../core/database.js";
import { Variables } from "../types.js";
import { requireStoreContext } from "../utils/requireStoreContext.js";

const products = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Lista produtos do catálogo da loja atual (isolado por store_id).
 */
products.get("/", async (c) => {
  const store = requireStoreContext(c);
  if (store instanceof Response) return store;
  try {
    const data = await getProductsByStore(c.env, store.id);
    c.header("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao buscar produtos";
    console.error("Products fetch error:", err);
    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * Retorna os product_id que estão no top de vendas (view_top_sellers).
 * Usado na vitrine para o badge MAIS VENDIDO e no admin para o ícone de fogo.
 * Se a view estiver vazia (ex.: sem vendas nos últimos 30 dias), retorna [].
 */
products.get("/trending", async (c) => {
  const store = requireStoreContext(c);
  if (store instanceof Response) return store;
  try {
    const productIds = await getTrendingProductIds(c.env, store.id);
    return c.json({ success: true, data: productIds }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao buscar trending";
    console.error("[GET /api/products/trending]", err);
    return c.json({ success: false, error: message }, 500);
  }
});

export default products;
