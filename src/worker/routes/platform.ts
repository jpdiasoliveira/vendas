import { Hono } from "hono";
import { verifyPlatformOperator } from "../middlewares/verifyPlatformOperator.js";
import { createStoreWithOwner } from "../core/database.js";
import type { AuthUser, Variables } from "../types.js";
import { genericServerErrorMessage, logServerError } from "../utils/safeApiError.js";

const platform = new Hono<{ Bindings: Env; Variables: Variables }>();

platform.use("*", verifyPlatformOperator);

/**
 * Cria loja (tenant), store_settings padrão e vínculo owner em store_members.
 */
platform.post("/stores", async (c) => {
  const user = c.get("user") as AuthUser;
  const body = (await c.req.json()) as {
    slug?: string;
    displayName?: string;
    display_name?: string;
  };

  const slug = typeof body.slug === "string" ? body.slug : "";
  const displayNameRaw =
    typeof body.displayName === "string"
      ? body.displayName
      : typeof body.display_name === "string"
        ? body.display_name
        : "";
  const displayName = displayNameRaw;
  if (!slug.trim() || !displayName.trim()) {
    return c.json({ success: false, error: "Informe slug e nome da loja." }, 400);
  }

  try {
    const created = await createStoreWithOwner(c.env, {
      slug: slug.trim(),
      displayName: displayName.trim(),
      ownerUserId: user.id,
    });
    return c.json({ success: true, data: created }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : genericServerErrorMessage();
    if (msg === "DUPLICATE_SLUG" || msg.toLowerCase().includes("duplicate") || msg.includes("23505")) {
      return c.json({ success: false, error: "Já existe uma loja com este slug. Escolha outro." }, 409);
    }
    logServerError("platform.post /stores", err);
    return c.json({ success: false, error: msg.length < 120 ? msg : genericServerErrorMessage() }, 400);
  }
});

export default platform;
