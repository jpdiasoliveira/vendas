export const adminMeQueryKey = ["admin", "me"] as const;

export const storeSettingsQueryKey = ["store", "settings"] as const;

/** Lista de produtos (admin); inclui slug da loja para cache multi-tenant. */
export const adminProductsQueryKey = (storeSlug: string) => ["admin", "products", storeSlug] as const;

/** Lista de categorias (admin). */
export const adminCategoriesQueryKey = (storeSlug: string) => ["admin", "categories", storeSlug] as const;

/** Formulário de configurações (GET /api/admin/settings), distinto do settings público da vitrine. */
export const adminStoreSettingsFormQueryKey = (storeSlug: string) =>
  ["admin", "store-settings-form", storeSlug] as const;

/** Credenciais Mercado Pago por loja (GET /api/admin/store/payments). */
export const adminStorePaymentsQueryKey = (storeSlug: string) =>
  ["admin", "store-payments", storeSlug] as const;

/** Inscritos na newsletter (admin), por loja e página. */
export const adminNewsletterSubscribersQueryKey = (storeSlug: string, limit: number, offset: number) =>
  ["admin", "newsletter-subscribers", storeSlug, limit, offset] as const;
