/**
 * JWT Supabase para cliente da loja (pedidos). Não exige store_members.
 */

import { createMiddleware } from "hono/factory";
import { getClaimsFromSupabaseAccessToken } from "./supabaseJwt.js";
import type { AuthUser, Variables } from "../types.js";

export const verifyCustomerAuth = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    return c.json({ success: false, error: "Token de acesso ausente" }, 401);
  }

  const claims = await getClaimsFromSupabaseAccessToken(token, c.env);
  if (!claims) {
    return c.json({ success: false, error: "Token inválido ou expirado" }, 401);
  }

  const user: AuthUser = {
    id: claims.sub,
    role: "customer",
    email: claims.email,
  };
  c.set("user", user);
  await next();
});
