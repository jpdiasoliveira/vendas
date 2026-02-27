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

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Gera a URL de redirecionamento segura para o OAuth (ex: Google) repassando chaves de acesso.
 * @param {Context} c - Cloudflare env variables param.
 * @returns {Response} Endpoint 200 com a URL de Redirect da provedora gerada pelo Mocha.
 */
auth.get("/oauth/google/redirect_url", async (c) => {
    const redirectUrl = await getOAuthRedirectUrl("google", {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });

    return c.json({ redirectUrl }, 200);
});

/**
 * Converte o Ticket Code gerado em um JWT de Sessão autorizada durável.
 * @param {Context} c - Post payload contento o "code" único hash validado externamente.
 * @returns {Response} Sucesso gravando token em HttpOnly Cookie Edge.
 */
auth.post("/sessions", async (c) => {
    const body = await c.req.json();

    if (!body.code) {
        return c.json({ error: "No authorization code provided", code: "MISSING_OAUTH_CODE" }, 400);
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
        maxAge: 60 * 24 * 60 * 60, // 60 dias
    });

    return c.json({ success: true }, 200);
});

/**
 * Checa a validade contínua do Usuário batendo a Cookie atual contra o registry Edge global.
 * @param {Context} c - Cookies header parser.
 * @returns {Response} Profile seguro se vivo, ou null se expirado.
 */
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

/**
 * Força a destruição do container de Sessão no Mocha Server em cadeia com expurgo local.
 * @param {Context} c - Cookie token a ser assassinado.
 * @returns {Response} Success confirmation limpando Cookie path para MaxAge nulo.
 */
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

    return c.json({ success: true }, 200);
});

export default auth;
