interface Env {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
  MERCADO_PAGO_ACCESS_TOKEN: string;
  /** Secret da assinatura de webhooks (Suas integrações > Webhooks). Recomendado em produção. */
  MERCADO_PAGO_WEBHOOK_SECRET?: string;
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
}
