/**
 * Rate limiting para tentativas de login: 20 por minuto por IP.
 * Janela de 60 segundos; após 60s o contador é reiniciado.
 */

import { createMiddleware } from "hono/factory";

const WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 20;
const CACHE_KEY_PREFIX = "https://ratelimit.login/";
const ERROR_MESSAGE =
  "Muitas tentativas de login. Por segurança, aguarde 1 minuto.";

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "unknown";
}

export const rateLimitLogin = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const ip = getClientIp(c);
  const key = CACHE_KEY_PREFIX + ip;
  const now = Date.now();

  const cache = await caches.open("ratelimit-login");
  const cached = await cache.match(key);
  let count = 0;
  let windowStart = now;

  if (cached) {
    try {
      const json = await cached.json() as { count: number; windowStart: number };
      if (now - json.windowStart < WINDOW_MS) {
        count = json.count ?? 0;
        windowStart = json.windowStart;
      }
    } catch {
      count = 0;
    }
  }

  if (count >= MAX_ATTEMPTS) {
    return c.json({ success: false, error: ERROR_MESSAGE }, 429);
  }

  count += 1;
  await cache.put(
    key,
    new Response(JSON.stringify({ count, windowStart }), {
      headers: { "Content-Type": "application/json" },
    })
  );

  await next();
});
