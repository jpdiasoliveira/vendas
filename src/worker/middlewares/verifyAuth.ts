/**
 * Middleware de proteção para rotas /api/admin/*.
 * Valida o JWT no header Authorization (Supabase: JWKS ou JWT Secret), verifica store_members e injeta user no contexto.
 */

import { createMiddleware } from "hono/factory";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { getStoreMember } from "../core/database.js";
import type { Variables } from "../types.js";

export type AuthUser = {
  id: string;
  role: string;
};

export const verifyAuth = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return c.json({ success: false, error: "Token de acesso ausente" }, 401);
  }

  let userId: string;
  try {
    let payload: { sub?: string } | undefined;

    // 1) Tentar verificação via JWKS (Supabase com chaves assimétricas)
    const supabaseUrl = (c.env.SUPABASE_URL ?? "").replace(/\/$/, "");
    if (supabaseUrl) {
      try {
        const jwksUrl = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;
        const JWKS = createRemoteJWKSet(new URL(jwksUrl));
        const result = await jwtVerify(token, JWKS);
        payload = result.payload;
      } catch {
        payload = undefined;
      }
    }

    // 2) Se JWKS não retornou payload, usar JWT Secret (legado / HS256)
    if (!payload?.sub) {
      const rawSecret = (c.env.SUPABASE_JWT_SECRET ?? "").trim();
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
        payload = result.payload;
      } catch {
        const result = await jwtVerify(token, secretBytes);
        payload = result.payload;
      }
    }

    const sub = payload?.sub;
    if (!sub || typeof sub !== "string") {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }
    userId = sub;
  } catch {
    return c.json({ success: false, error: "Token inválido ou expirado" }, 401);
  }

  const store = c.get("store");
  let member;
  try {
    member = await getStoreMember(c.env, userId, store.id);
  } catch (err) {
    console.error("verifyAuth getStoreMember error:", err);
    return c.json({ success: false, error: "Erro ao verificar permissão" }, 500);
  }

  if (!member) {
    return c.json(
      { success: false, error: "Você não tem acesso a esta loja" },
      403
    );
  }

  const user: AuthUser = { id: userId, role: member.role };
  c.set("user", user);
  await next();
});
