/**
 * Middleware de proteção para rotas /api/admin/*.
 * Valida o JWT no header Authorization, verifica se o usuário é membro ativo da loja (store_members)
 * e injeta o user no contexto (c.set('user', user)).
 */

import { createMiddleware } from "hono/factory";
import { jwtVerify } from "jose";
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
    const secret = new TextEncoder().encode(c.env.SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const sub = payload.sub;
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
