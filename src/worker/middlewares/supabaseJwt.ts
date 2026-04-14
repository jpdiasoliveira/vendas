/**
 * Valida access_token JWT do Supabase Auth (JWKS ou HS256 com JWT Secret).
 * Usado por verifyAuth (admin) e verifyCustomerAuth (pedidos da loja).
 */

import { jwtVerify, createRemoteJWKSet } from "jose";

type JwtEnv = {
  SUPABASE_URL?: string;
  SUPABASE_JWT_SECRET?: string;
};

export type SupabaseJwtClaims = {
  sub: string;
  email?: string;
};

/**
 * @returns `null` se token inválido ou expirado.
 */
export async function getClaimsFromSupabaseAccessToken(
  token: string,
  env: JwtEnv
): Promise<SupabaseJwtClaims | null> {
  try {
    let payload: { sub?: string; email?: string } | undefined;

    const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
    if (supabaseUrl) {
      try {
        const jwksUrl = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;
        const JWKS = createRemoteJWKSet(new URL(jwksUrl));
        const result = await jwtVerify(token, JWKS);
        payload = result.payload as { sub?: string; email?: string };
      } catch {
        payload = undefined;
      }
    }

    if (!payload?.sub) {
      const rawSecret = (env.SUPABASE_JWT_SECRET ?? "").trim();
      const secretAsUtf8 = new TextEncoder().encode(rawSecret);
      let secretBytes: Uint8Array = secretAsUtf8;
      try {
        const base64 = rawSecret.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "==".slice(0, (4 - (base64.length % 4)) % 4);
        const binary = atob(padded);
        secretBytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) secretBytes[i] = binary.charCodeAt(i);
      } catch {
        /* usar secretAsUtf8 */
      }
      try {
        const result = await jwtVerify(token, secretAsUtf8);
        payload = result.payload as { sub?: string; email?: string };
      } catch {
        const result = await jwtVerify(token, secretBytes);
        payload = result.payload as { sub?: string; email?: string };
      }
    }

    const sub = payload?.sub;
    if (!sub || typeof sub !== "string") return null;
    const email = typeof payload.email === "string" ? payload.email : undefined;
    return { sub, email };
  } catch {
    return null;
  }
}
