/**
 * Resolve o Access Token do Mercado Pago: credencial da loja (cifrada) ou fallback global do Worker.
 */

import {
  findStoreIdByMpPaymentId,
  getDecryptedMercadoPagoAccessToken,
} from "../core/db/stores/storeMpCredentialsRepo.js";

export async function resolveMercadoPagoAccessTokenForStore(env: Env, storeId: string): Promise<string> {
  const per = await getDecryptedMercadoPagoAccessToken(env, storeId);
  if (per?.trim()) return per.trim();
  const g = env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (g) return g;
  throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado para esta loja.");
}

/**
 * Webhook: descobre a loja pelo `payment_id` já gravado no pedido; senão usa token global.
 */
export async function resolveMercadoPagoAccessTokenForPaymentId(
  env: Env,
  paymentId: string | number
): Promise<string> {
  const sid = await findStoreIdByMpPaymentId(env, String(paymentId));
  if (sid) {
    try {
      return await resolveMercadoPagoAccessTokenForStore(env, sid);
    } catch {
      /* continuar para fallback global */
    }
  }
  const g = env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (g) return g;
  throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
}
