import { Store } from "@/react-app/types";

/**
 * Middleware SaaS de isolamento dinâmico (Tenant Id).
 * Escuta os headers para validar a existência da loja no D1 (borda local) e repassa os atributos para a rota.
 * 
 * @param {any} c - O objeto de Contexto do Hono que provê o Header 'x-store-slug' gerado pelo frontend.
 * @param {any} next - O callback para prosseguir a execução se a loja for autorizada.
 * @returns {Promise<Response | void>} Injeta 'store' no contexto ou retorna JSON de erro padronizado (400/404).
 */
export const storeMiddleware = async (c: any, next: any) => {
    const storeSlug = c.req.header("x-store-slug");

    if (!storeSlug) {
        return c.json({ error: "Identificação da loja (x-store-slug) é obrigatória", code: "MISSING_TENANT_ID" }, 400);
    }

    // Validação rápida de cache/metadados no SQLite/D1 via Cloudflare Edge
    const store = await c.env.DB.prepare(
        "SELECT * FROM stores WHERE slug = ? AND status = 'active'"
    )
        .bind(storeSlug)
        .first() as Store;

    if (!store) {
        return c.json({ error: "Loja não encontrada ou inativa", code: "TENANT_NOT_FOUND" }, 404);
    }

    c.set("store", store);
    await next();
};
