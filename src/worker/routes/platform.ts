import { Hono } from "hono";
import { verifyPlatformOperator } from "../middlewares/verifyPlatformOperator.js";
import { addDomainsToStore, createStoreWithOwner, listPlatformStores } from "../core/database.js";
import type { AuthUser, Variables } from "../types.js";
import { genericServerErrorMessage, logServerError } from "../utils/safeApiError.js";

const platform = new Hono<{ Bindings: Env; Variables: Variables }>();

platform.use("*", verifyPlatformOperator);

platform.get("/stores", async (c) => {
  try {
    const data = await listPlatformStores(c.env);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    logServerError("platform.get /stores", err);
    return c.json({ success: false, error: genericServerErrorMessage() }, 500);
  }
});

platform.post("/stores/:storeId/domains", async (c) => {
  const storeId = c.req.param("storeId");
  const body = (await c.req.json()) as { domains?: string[]; setPrimaryFirst?: boolean };
  const domains = Array.isArray(body.domains)
    ? body.domains.filter((d): d is string => typeof d === "string" && d.trim().length > 0)
    : [];
  if (domains.length === 0) {
    return c.json({ success: false, error: "Informe ao menos um domínio." }, 400);
  }
  try {
    await addDomainsToStore(c.env, {
      storeId,
      domains,
      setPrimaryFirst: body.setPrimaryFirst === true,
    });
    return c.json({ success: true, data: { ok: true } }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : genericServerErrorMessage();
    if (msg.includes("STORE_NOT_FOUND")) {
      return c.json({ success: false, error: "Loja não encontrada." }, 404);
    }
    logServerError("platform.post /stores/:storeId/domains", err);
    return c.json({ success: false, error: msg.length < 120 ? msg : genericServerErrorMessage() }, 400);
  }
});

/**
 * Cria loja (tenant), store_settings padrão e vínculo owner em store_members.
 */
platform.post("/stores", async (c) => {
  const user = c.get("user") as AuthUser;
  const body = (await c.req.json()) as {
    slug?: string;
    displayName?: string;
    display_name?: string;
    customDomains?: string[];
    custom_domains?: string[];
  };

  const slug = typeof body.slug === "string" ? body.slug : "";
  const displayNameRaw =
    typeof body.displayName === "string"
      ? body.displayName
      : typeof body.display_name === "string"
        ? body.display_name
        : "";
  const displayName = displayNameRaw;
  const customDomainsRaw = Array.isArray(body.customDomains)
    ? body.customDomains
    : Array.isArray(body.custom_domains)
      ? body.custom_domains
      : [];
  const customDomains = customDomainsRaw
    .filter((d): d is string => typeof d === "string")
    .map((d) => d.trim())
    .filter(Boolean);
  if (!slug.trim() || !displayName.trim()) {
    return c.json({ success: false, error: "Informe slug e nome da loja." }, 400);
  }

  try {
    const created = await createStoreWithOwner(c.env, {
      slug: slug.trim(),
      displayName: displayName.trim(),
      ownerUserId: user.id,
      customDomains,
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
