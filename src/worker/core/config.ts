/**
 * Leitura de flags de ambiente (Worker / Wrangler usam strings).
 * Valores desconhecidos caem no default (fail-safe para REQUIRE_MP_WEBHOOK_SECRET = não exigir).
 */

const TRUTHY = new Set(["true", "1", "yes", "on"]);
const FALSY = new Set(["false", "0", "no", "off", ""]);

export function envBooleanFlag(
  value: string | boolean | undefined,
  defaultValue = false
): boolean {
  if (value === true) return true;
  if (value === false) return false;
  if (value == null || value === "") return defaultValue;
  const s = String(value).trim().toLowerCase();
  if (TRUTHY.has(s)) return true;
  if (FALSY.has(s)) return false;
  return defaultValue;
}

type WebhookSecretEnv = {
  REQUIRE_MP_WEBHOOK_SECRET?: string | boolean;
  /** `production` ou `prod` força validação HMAC do webhook MP (como `REQUIRE_MP_WEBHOOK_SECRET=true`). */
  ENVIRONMENT?: string;
};

const isProductionDeployment = (env: WebhookSecretEnv): boolean => {
  const s = String(env.ENVIRONMENT ?? "").trim().toLowerCase();
  return s === "production" || s === "prod";
};

/**
 * Webhook Mercado Pago: assinatura + secret obrigatórios quando `ENVIRONMENT` é produção
 * ou `REQUIRE_MP_WEBHOOK_SECRET=true`. Em desenvolvimento (omitido), permite IPN sem secret
 * apenas se `REQUIRE_MP_WEBHOOK_SECRET` não for true.
 */
export function isRequireMpWebhookSecret(env: WebhookSecretEnv): boolean {
  if (isProductionDeployment(env)) return true;
  return envBooleanFlag(env.REQUIRE_MP_WEBHOOK_SECRET, false);
}
