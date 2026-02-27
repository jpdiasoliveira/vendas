import { Hono } from "hono";
import { getSupabase } from "../core/supabase.js";
import { Variables } from "../types.js";

const products = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Endpoint público que lista todos os produtos do catálogo dinâmico da Loja atual.
 * Isola estritamente os registros filtrando na cláusula via `store_id` (PostgreSQL UUID do Tenant).
 * 
 * @param {Context} c - Contexto HTTP mapeado via Middleware da abstração Hono contendo a env DB.
 * @returns {Response} Código 200 contendo o Array estruturado JSON dos itens encontrados. Código 500 persistente para errors de rede.
 */
products.get("/", async (c) => {
    const store = c.get("store");
    const supabase = getSupabase(c.env);

    const { data: results, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Supabase Error [Products]:", error.message);
        return c.json({ error: error.message, code: "DATABASE_FETCH_ERROR" }, 500);
    }

    return c.json(results, 200);
});

export default products;
