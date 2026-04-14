/**
 * Middleware de proteção para rotas /api/admin/*.
 * Valida o JWT no header Authorization (Supabase: JWKS ou JWT Secret), verifica store_members e injeta user no contexto.
 */

import { createMiddleware } from "hono/factory";
import { getStoreMember } from "../core/database.js";
import { getClaimsFromSupabaseAccessToken } from "./supabaseJwt.js";
import type { AuthUser, Variables } from "../types.js";

export type { AuthUser };

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

  const claims = await getClaimsFromSupabaseAccessToken(token, c.env);
  if (!claims) {
    return c.json({ success: false, error: "Token inválido ou expirado" }, 401);
  }
  const userId = claims.sub;

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

  const user: AuthUser = { id: userId, role: member.role, email: claims.email };
  c.set("user", user);
  await next();
});
