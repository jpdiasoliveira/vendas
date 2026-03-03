import { Hono } from "hono";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
  getCurrentUser,
} from "@getmocha/users-service/backend";
import { getCookie, setCookie } from "hono/cookie";
import { Variables } from "../types.js";
import { rateLimitLogin } from "../middlewares/rateLimitLogin.js";

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * POST /api/login — Login com email/senha (Supabase Auth).
 * Rate limit: 20 tentativas por minuto por IP. 429 após exceder.
 */
auth.post("/login", rateLimitLogin, async (c) => {
  let body: { email?: string; password?: string };
  try {
    body = (await c.req.json()) as { email?: string; password?: string };
  } catch {
    return c.json({ success: false, error: "Corpo JSON inválido" }, 400);
  }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return c.json({ success: false, error: "E-mail e senha são obrigatórios" }, 400);
  }

  const anonKey = c.env.SUPABASE_ANON_KEY;
  const supabaseUrl = c.env.SUPABASE_URL;
  if (!anonKey || !supabaseUrl) {
    return c.json(
      {
        success: false,
        error:
          "Login não configurado no servidor. Defina SUPABASE_URL e SUPABASE_ANON_KEY em .dev.vars (raiz do projeto) e reinicie o Worker (wrangler dev).",
      },
      503
    );
  }

  let res: Response;
  try {
    res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    console.error("Login: falha ao chamar Supabase Auth", err);
    return c.json({ success: false, error: "Serviço de login indisponível" }, 503);
  }

  const text = await res.text();
  let data: { access_token?: string; refresh_token?: string; user?: unknown; error_description?: string };
  try {
    data = text ? (JSON.parse(text) as typeof data) : {};
  } catch {
    return c.json({ success: false, error: "Credenciais inválidas" }, 401);
  }

  if (!res.ok) {
    const msg = (data && data.error_description) ? String(data.error_description) : "Credenciais inválidas";
    return c.json({ success: false, error: msg }, 401);
  }

  return c.json(
    {
      success: true,
      data: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
      },
    },
    200
  );
});

auth.get("/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });
  return c.json({ success: true, data: { redirectUrl } }, 200);
});

auth.post("/sessions", async (c) => {
  const body = (await c.req.json()) as { code?: string };

  if (!body.code) {
    return c.json({ success: false, error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60,
  });

  return c.json({ success: true, data: { ok: true } }, 200);
});

auth.get("/users/me", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (!sessionToken) {
    return c.json(null, 200);
  }

  const user = await getCurrentUser(sessionToken, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json(user, 200);
});

auth.get("/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true, data: { ok: true } }, 200);
});

export default auth;
