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

/**
 * Produção SaaS: defina `REQUIRE_MP_WEBHOOK_SECRET=true` + `MERCADO_PAGO_WEBHOOK_SECRET`.
 * Em desenvolvimento, omita ou use `false` para permitir webhook sem assinatura.
 */
export function isRequireMpWebhookSecret(env: { REQUIRE_MP_WEBHOOK_SECRET?: string | boolean }): boolean {
  return envBooleanFlag(env.REQUIRE_MP_WEBHOOK_SECRET, false);
}
