/**
 * JWT válido + e-mail em PLATFORM_OPERATOR_EMAILS (e secret opcional).
 * Rotas de criação de tenant sem x-store-slug.
 */

import { createMiddleware } from "hono/factory";
import { getClaimsFromSupabaseAccessToken } from "./supabaseJwt.js";
import type { AuthUser, Variables } from "../types.js";

function parseOperatorEmails(env: Env): string[] {
  const raw = env.PLATFORM_OPERATOR_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const verifyPlatformOperator = createMiddleware<{
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

  const allowed = parseOperatorEmails(c.env);
  if (allowed.length === 0) {
    return c.json(
      {
        success: false,
        error:
          "Criação de lojas não está habilitada. Defina PLATFORM_OPERATOR_EMAILS no Worker (e-mails separados por vírgula).",
      },
      503
    );
  }

  const email = (claims.email ?? "").trim().toLowerCase();
  if (!email || !allowed.includes(email)) {
    return c.json({ success: false, error: "Acesso restrito à equipe da plataforma." }, 403);
  }

  const secret = c.env.PLATFORM_CREATE_STORE_SECRET?.trim();
  if (secret) {
    const sent = c.req.header("x-platform-create-store-secret")?.trim();
    if (sent !== secret) {
      return c.json({ success: false, error: "Cabeçalho x-platform-create-store-secret inválido ou ausente." }, 403);
    }
  }

  const user: AuthUser = { id: claims.sub, role: "platform_operator", email: claims.email };
  c.set("user", user);
  await next();
});
