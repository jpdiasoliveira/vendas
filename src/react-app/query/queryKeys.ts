export const adminMeQueryKey = ["admin", "me"] as const;

export const storeSettingsQueryKey = ["store", "settings"] as const;

/** Lista de produtos (admin); inclui slug da loja para cache multi-tenant. */
export const adminProductsQueryKey = (storeSlug: string) => ["admin", "products", storeSlug] as const;

/** Lista de categorias (admin). */
export const adminCategoriesQueryKey = (storeSlug: string) => ["admin", "categories", storeSlug] as const;

/** Faixas de frete por CEP (admin). */
export const adminShippingFareBandsQueryKey = (storeSlug: string) =>
  ["admin", "shipping-fare-bands", storeSlug] as const;

/** Cupons (admin). */
export const adminCouponsQueryKey = (storeSlug: string) => ["admin", "coupons", storeSlug] as const;

/** Membros da equipe (admin). */
export const adminStoreMembersQueryKey = (storeSlug: string) => ["admin", "members", storeSlug] as const;

/** Formulário de configurações (GET /api/admin/settings), distinto do settings público da vitrine. */
export const adminStoreSettingsFormQueryKey = (storeSlug: string) =>
  ["admin", "store-settings-form", storeSlug] as const;

/** Credenciais Mercado Pago por loja (GET /api/admin/store/payments). */
export const adminStorePaymentsQueryKey = (storeSlug: string) =>
  ["admin", "store-payments", storeSlug] as const;

/** Inscritos na newsletter (admin), por loja e página. */
export const adminNewsletterSubscribersQueryKey = (storeSlug: string, limit: number, offset: number) =>
  ["admin", "newsletter-subscribers", storeSlug, limit, offset] as const;

/** Lista de pedidos (admin), por loja. */
export const adminOrdersQueryKey = (storeSlug: string) => ["admin", "orders", storeSlug] as const;

/** Detalhe de um pedido (admin), por loja e id. */
export const adminOrderDetailQueryKey = (storeSlug: string, orderId: string) =>
  ["admin", "orders", storeSlug, orderId] as const;

/** Resumo do dashboard de pedidos (admin). */
export const adminOrdersDashboardQueryKey = (storeSlug: string) =>
  ["admin", "orders-dashboard", storeSlug] as const;

/** Histórico de atividades (admin), por loja e filtros. */
export const adminAuditLogsQueryKey = (storeSlug: string, search: string, actionFilter: string) =>
  ["admin", "audit-logs", storeSlug, search, actionFilter] as const;

/** Dashboard da plataforma (analytics + ranking + novas lojas/semana). */
export const platformDashboardQueryKey = ["platform", "dashboard"] as const;

/** Catálogo de planos + entitlements (operador plataforma). */
export const platformPlansCatalogQueryKey = ["platform", "plans-catalog"] as const;

/** Configurações globais da plataforma (carência de assinatura). */
export const platformRuntimeSettingsQueryKey = ["platform", "runtime-settings"] as const;

/** Lista de lojas da plataforma (gestor). */
export const platformStoresQueryKey = ["platform", "stores"] as const;
