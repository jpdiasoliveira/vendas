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
