/**
 * Credenciais Mercado Pago por loja (colunas cifradas em store_settings).
 */

import { getSupabase } from "../../supabase.js";
import {
  decryptUtf8WithMasterSecret,
  encryptUtf8WithMasterSecret,
  isMpCredentialsMasterSecretConfigured,
} from "../../../utils/fieldCrypto.js";

export type StoreMpCredentialFlags = {
  mpAccessTokenConfigured: boolean;
  mpPublicKeyConfigured: boolean;
};

export async function getStoreMpCredentialFlags(env: Env, storeId: string): Promise<StoreMpCredentialFlags> {
  const supabase = getSupabase(env);
  const { data, error } = await supabase
    .from("store_settings")
    .select("mp_access_token_ciphertext, mp_public_key_ciphertext")
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as Record<string, unknown> | null;
  const tok = String(row?.mp_access_token_ciphertext ?? "").trim();
  const pk = String(row?.mp_public_key_ciphertext ?? "").trim();
  return {
    mpAccessTokenConfigured: tok.length > 0,
    mpPublicKeyConfigured: pk.length > 0,
  };
}

export async function getDecryptedMercadoPagoAccessToken(
  env: Env,
  storeId: string
): Promise<string | null> {
  if (!isMpCredentialsMasterSecretConfigured(env)) return null;
  const master = String(env.MP_STORE_CREDENTIALS_SECRET).trim();
  const supabase = getSupabase(env);
  const { data, error } = await supabase
    .from("store_settings")
    .select("mp_access_token_ciphertext")
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const blob = String((data as { mp_access_token_ciphertext?: unknown } | null)?.mp_access_token_ciphertext ?? "").trim();
  if (!blob) return null;
  try {
    return await decryptUtf8WithMasterSecret(master, blob);
  } catch {
    return null;
  }
}

export async function getDecryptedMercadoPagoPublicKey(env: Env, storeId: string): Promise<string | null> {
  if (!isMpCredentialsMasterSecretConfigured(env)) return null;
  const master = String(env.MP_STORE_CREDENTIALS_SECRET).trim();
  const supabase = getSupabase(env);
  const { data, error } = await supabase
    .from("store_settings")
    .select("mp_public_key_ciphertext")
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const blob = String((data as { mp_public_key_ciphertext?: unknown } | null)?.mp_public_key_ciphertext ?? "").trim();
  if (!blob) return null;
  try {
    return await decryptUtf8WithMasterSecret(master, blob);
  } catch {
    return null;
  }
}

export type UpdateMpCredentialsPayload = {
  mpAccessToken: string | null | undefined;
  mpPublicKey: string | null | undefined;
};

/**
 * Grava ou limpa credenciais MP (cifradas). `null` ou string vazia limpa a coluna correspondente.
 */
export async function upsertStoreMercadoPagoCredentials(
  env: Env,
  storeId: string,
  payload: UpdateMpCredentialsPayload
): Promise<void> {
  if (!isMpCredentialsMasterSecretConfigured(env)) {
    throw new Error("MP_STORE_CREDENTIALS_SECRET_NOT_CONFIGURED");
  }
  const master = String(env.MP_STORE_CREDENTIALS_SECRET).trim();
  const supabase = getSupabase(env);

  let encTok: string | null | undefined;
  if (payload.mpAccessToken !== undefined) {
    const t = String(payload.mpAccessToken ?? "").trim();
    encTok = t === "" ? null : await encryptUtf8WithMasterSecret(master, t);
  }
  let encPk: string | null | undefined;
  if (payload.mpPublicKey !== undefined) {
    const t = String(payload.mpPublicKey ?? "").trim();
    encPk = t === "" ? null : await encryptUtf8WithMasterSecret(master, t);
  }

  const { data: existing } = await supabase.from("store_settings").select("store_id").eq("store_id", storeId).maybeSingle();

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (encTok !== undefined) patch.mp_access_token_ciphertext = encTok;
  if (encPk !== undefined) patch.mp_public_key_ciphertext = encPk;

  if (existing) {
    const { error } = await supabase.from("store_settings").update(patch).eq("store_id", storeId);
    if (error) throw new Error(error.message);
    return;
  }

  const insertRow: Record<string, unknown> = {
    store_id: storeId,
    public_profile: {},
    theme: {},
    business_rules: {},
    operating_hours: {},
    order_limits: {},
    updated_at: new Date().toISOString(),
    mp_access_token_ciphertext: encTok ?? null,
    mp_public_key_ciphertext: encPk ?? null,
  };
  const { error: insErr } = await supabase.from("store_settings").insert(insertRow);
  if (insErr) throw new Error(insErr.message);
}

/** Resolve `store_id` a partir do `payment_id` gravado no pedido (webhook / sync). */
export async function findStoreIdByMpPaymentId(env: Env, paymentId: string): Promise<string | null> {
  const supabase = getSupabase(env);
  const pid = String(paymentId).trim();
  if (!pid) return null;
  const { data, error } = await supabase.from("orders").select("store_id").eq("payment_id", pid).maybeSingle();
  if (error) throw new Error(error.message);
  const sid = (data as { store_id?: unknown } | null)?.store_id;
  return sid != null ? String(sid).trim() : null;
}
