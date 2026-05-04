import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getStoreSettingsWithDisplayName } from "../core/database.js";
import { insertNewsletterSubscriber } from "../core/db/newsletterSubscribersRepo.js";
import { newsletterSubscribeBodySchema } from "../schemas/newsletter.js";
import type { Variables } from "../types.js";
import { genericServerErrorMessage, logServerError } from "../utils/safeApiError.js";
import { requireStoreContext } from "../utils/requireStoreContext.js";
import { zodErrorToMessage } from "../utils/zodErrorMessage.js";

/**
 * Rotas públicas da loja (exigem x-store-slug via storeMiddleware).
 * GET /api/store/settings: vitrine e carrinho (nome, logo, cor, valor mínimo, public_profile).
 * POST /api/store/newsletter/subscribe: grava e-mail na tabela newsletter_subscribers.
 */
const store = new Hono<{ Bindings: Env; Variables: Variables }>();

store.get("/settings", async (c) => {
  const store = requireStoreContext(c);
  if (store instanceof Response) return store;
  try {
    const data = await getStoreSettingsWithDisplayName(c.env, store.id);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao carregar configurações";
    return c.json({ success: false, error: message }, 500);
  }
});

store.post(
  "/newsletter/subscribe",
  zValidator("json", newsletterSubscribeBodySchema, (result, c) => {
    if (!result.success) {
      return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
    }
  }),
  async (c) => {
    const storeCtx = requireStoreContext(c);
    if (storeCtx instanceof Response) return storeCtx;
    const { email } = c.req.valid("json");
    try {
      await insertNewsletterSubscriber(c.env, storeCtx.id, email);
      return c.json({ success: true, data: { ok: true as const } }, 200);
    } catch (err: unknown) {
      logServerError("store.post /newsletter/subscribe", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  }
);

export default store;
