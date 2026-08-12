import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authLoginBodySchema } from "../../schemas/auth.js";
import { Variables } from "../types.js";
import { rateLimitLogin } from "../middlewares/rateLimitLogin.js";
import { zodErrorToMessage } from "../utils/zodErrorMessage.js";

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * POST /api/login — Login com email/senha (Supabase Auth).
 * Rate limit: 20 tentativas por minuto por IP. 429 após exceder.
 */
auth.post(
  "/login",
  rateLimitLogin,
  zValidator("json", authLoginBodySchema, (result, c) => {
    if (!result.success) {
      return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
    }
  }),
  async (c) => {
    const { email, password } = c.req.valid("json");

    const anonKey = c.env.SUPABASE_ANON_KEY;
    const supabaseUrl = c.env.SUPABASE_URL;
    if (!anonKey || !supabaseUrl) {
      return c.json(
        {
          success: false,
          error:
            "Login não configurado no servidor. Defina SUPABASE_URL e SUPABASE_ANON_KEY em .dev.vars (raiz do projeto) e reinicie o Worker (wrangler dev).",
        },
        503,
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
      const msg = data?.error_description ? String(data.error_description) : "Credenciais inválidas";
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
      200,
    );
  },
);

export default auth;
