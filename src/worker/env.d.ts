interface Env {
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
  MERCADO_PAGO_ACCESS_TOKEN: string;
  /** Secret da assinatura de webhooks (Suas integrações > Webhooks). Recomendado em produção. */
  MERCADO_PAGO_WEBHOOK_SECRET?: string;
  /**
   * Se true: webhook MP recusa sem secret ou com assinatura inválida (403). Obrigatório em produção SaaS.
   * false/omitido: permite notificação sem secret (apenas desenvolvimento).
   */
  REQUIRE_MP_WEBHOOK_SECRET?: string | boolean;
  /** Origens CORS permitidas, separadas por vírgula. Padrão dev: http://localhost:5173 */
  CORS_ORIGIN?: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  /** JWT Secret do projeto Supabase (Project Settings > API > JWT Secret) para validar tokens do Auth. */
  SUPABASE_JWT_SECRET: string;
  /** Anon key (opcional) para proxy de login em POST /api/login e rate limiting. */
  SUPABASE_ANON_KEY?: string;
  ASSETS: Fetcher;
  /** Opcional: URL base pública para o webhook (ex: https://seu-dominio.com). Se definida, notification_url é enviada ao MP. */
  NOTIFICATION_BASE_URL?: string;
  /**
   * URL absoluta da vitrine (ex.: https://loja.com ou http://localhost:5173).
   * Usada em back_urls do Checkout Pro e, em dev, como fallback se Origin não for enviado.
   */
  STOREFRONT_BASE_URL?: string;
  /**
   * E-mails (separados por vírgula) autorizados a POST /api/platform/stores.
   * Ex.: operador@empresa.com,joao@empresa.com — comparação case-insensitive com o e-mail do JWT.
   */
  PLATFORM_OPERATOR_EMAILS?: string;
  /** Se definido, POST /api/platform/stores exige header x-platform-create-store-secret com o mesmo valor. */
  PLATFORM_CREATE_STORE_SECRET?: string;
  /** API key Resend (https://resend.com). Sem ela, e-mails transacionais são ignorados silenciosamente. */
  RESEND_API_KEY?: string;
  /** Remetente verificado no Resend, ex.: `Natfoods <pedidos@seudominio.com>`. */
  RESEND_FROM_EMAIL?: string;
  /**
   * Idade mínima (minutos) de pedidos `pending` para expirar no cron (`expire_old_orders`). Padrão 60.
   */
  ORDER_EXPIRE_PENDING_MINUTES?: string;
  /** Máximo de pedidos processados por execução do cron. Padrão 100 (máx. 5000 na RPC). */
  ORDER_EXPIRE_BATCH?: string;
}
