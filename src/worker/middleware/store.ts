import type { Store } from "../core/schema.js";

/**
 * Middleware SaaS de isolamento dinâmico (Tenant Id).
 * Valida o slug no D1 e injeta a loja (camelCase) no contexto.
 */
function rowToStore(row: Record<string, unknown>): Store {
  return {
    id: row.id as string,
    slug: row.slug as string,
    displayName: row.display_name as string,
    status: row.status as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export const storeMiddleware = async (c: any, next: any) => {
  if (c.req.path.startsWith("/api/webhooks")) {
    return next();
  }

  const storeSlug = c.req.header("x-store-slug");

  if (!storeSlug) {
    return c.json({ success: false, error: "Identificação da loja (x-store-slug) é obrigatória" }, 400);
  }

  const row = await c.env.DB.prepare(
    "SELECT * FROM stores WHERE slug = ? AND status = 'active'"
  )
    .bind(storeSlug)
    .first() as Record<string, unknown> | null;

  if (!row) {
    return c.json({ success: false, error: "Loja não encontrada ou inativa" }, 404);
  }

  c.set("store", rowToStore(row));
  await next();
};
