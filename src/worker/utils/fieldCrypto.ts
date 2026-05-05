/**
 * Cifra valores UTF-8 com AES-256-GCM para persistir em Postgres (service_role).
 * Chave derivada por SHA-256 de MP_STORE_CREDENTIALS_SECRET (mín. 32 caracteres recomendado).
 */

const ALGO = "AES-GCM";
const IV_LEN = 12;

const bytesToBase64 = (bytes: Uint8Array): string => {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  return btoa(bin);
};

const base64ToBytes = (b64: string): Uint8Array => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const deriveKey = async (masterSecret: string): Promise<CryptoKey> => {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(masterSecret));
  return crypto.subtle.importKey("raw", raw, { name: ALGO, length: 256 }, false, ["encrypt", "decrypt"]);
};

export const encryptUtf8WithMasterSecret = async (
  masterSecret: string,
  plaintext: string
): Promise<string> => {
  const key = await deriveKey(masterSecret);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const enc = new Uint8Array(
    await crypto.subtle.encrypt({ name: ALGO, iv }, key, new TextEncoder().encode(plaintext))
  );
  const combined = new Uint8Array(iv.length + enc.length);
  combined.set(iv, 0);
  combined.set(enc, iv.length);
  return bytesToBase64(combined);
};

export const decryptUtf8WithMasterSecret = async (
  masterSecret: string,
  blobB64: string
): Promise<string> => {
  const combined = base64ToBytes(blobB64.trim());
  if (combined.length < IV_LEN + 16) throw new Error("INVALID_CIPHER_BLOB");
  const iv = combined.slice(0, IV_LEN);
  const data = combined.slice(IV_LEN);
  const key = await deriveKey(masterSecret);
  const dec = await crypto.subtle.decrypt({ name: ALGO, iv }, key, data);
  return new TextDecoder().decode(dec);
};

export const isMpCredentialsMasterSecretConfigured = (env: { MP_STORE_CREDENTIALS_SECRET?: string }): boolean =>
  Boolean(env.MP_STORE_CREDENTIALS_SECRET && String(env.MP_STORE_CREDENTIALS_SECRET).trim().length >= 16);
