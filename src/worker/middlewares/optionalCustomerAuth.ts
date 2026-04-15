/**
 * JWT Supabase opcional: se houver Bearer válido, injeta user; caso contrário segue sem user.
 * Rotas de pedido que aceitam checkout visitante usam este middleware.
 */

import { createMiddleware } from "hono/factory";
import { getClaimsFromSupabaseAccessToken } from "./supabaseJwt.js";
import type { AuthUser, Variables } from "../types.js";

export const optionalCustomerAuth = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    await next();
    return;
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
