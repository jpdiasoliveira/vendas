/**
 * Valida apenas o JWT Supabase (sem loja em contexto).
 * Usado em /api/me/* para consultas multi-tenant antes de saber o slug.
 */

import { createMiddleware } from "hono/factory";
import { getClaimsFromSupabaseAccessToken } from "./supabaseJwt.js";
import type { Variables } from "../types.js";

export const verifyJwtOnly = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    return c.json({ success: false, error: "Token de acesso ausente" }, 401);
  }

  const claims = await getClaimsFromSupabaseAccessToken(token, c.env);
  if (!claims?.sub) {
    return c.json({ success: false, error: "Token inválido ou expirado" }, 401);
  }

  c.set("jwtSubject", claims.sub);
  await next();
});
