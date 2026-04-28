import { Hono } from "hono";
import { verifyPlatformOperator } from "../middlewares/verifyPlatformOperator.js";
import {
  addDomainsToStore,
  createStoreWithOwner,
  getPlatformAnalyticsOverview,
  getPlatformStoreRanking,
  getSubscriptionGraceDays,
  listPlatformStores,
  upsertSubscriptionGraceDays,
} from "../core/database.js";
import type { AuthUser, Variables } from "../types.js";
import { genericServerErrorMessage, logServerError } from "../utils/safeApiError.js";

const platform = new Hono<{ Bindings: Env; Variables: Variables }>();

platform.use("*", verifyPlatformOperator);

platform.get("/runtime-settings", async (c) => {
  try {
    const subscriptionGraceDays = await getSubscriptionGraceDays(c.env);
    return c.json({ success: true, data: { subscriptionGraceDays } }, 200);
  } catch (err: unknown) {
    logServerError("platform.get /runtime-settings", err);
    return c.json({ success: false, error: genericServerErrorMessage() }, 500);
  }
});

platform.patch("/runtime-settings", async (c) => {
  const body = (await c.req.json()) as {
    subscriptionGraceDays?: unknown;
    subscription_grace_days?: unknown;
  };
  const raw = body.subscriptionGraceDays ?? body.subscription_grace_days;
  const days = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(days)) {
    return c.json({ success: false, error: "Informe subscriptionGraceDays (0 a 90)." }, 400);
  }
  try {
    const subscriptionGraceDays = await upsertSubscriptionGraceDays(c.env, days);
    return c.json({ success: true, data: { subscriptionGraceDays } }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "INVALID_GRACE_DAYS") {
      return c.json({ success: false, error: "Carência inválida. Use um inteiro entre 0 e 90 dias." }, 400);
    }
    logServerError("platform.patch /runtime-settings", err);
    return c.json({ success: false, error: genericServerErrorMessage() }, 500);
  }
});

platform.get("/stores", async (c) => {
  try {
    const data = await listPlatformStores(c.env);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    logServerError("platform.get /stores", err);
    return c.json({ success: false, error: genericServerErrorMessage() }, 500);
  }
});

platform.get("/analytics/overview", async (c) => {
  try {
    const data = await getPlatformAnalyticsOverview(c.env);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    logServerError("platform.get /analytics/overview", err);
    return c.json({ success: false, error: genericServerErrorMessage() }, 500);
  }
});

platform.get("/analytics/store-ranking", async (c) => {
  const raw = c.req.query("limit");
  const n = raw != null && raw !== "" ? Number(raw) : 15;
  const limit = Number.isFinite(n) ? Math.trunc(n) : 15;
  try {
    const data = await getPlatformStoreRanking(c.env, limit);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    logServerError("platform.get /analytics/store-ranking", err);
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
    planSlug?: string;
    plan_definition_slug?: string;
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

  const planSlugRaw =
    typeof body.planSlug === "string"
      ? body.planSlug
      : typeof body.plan_definition_slug === "string"
        ? body.plan_definition_slug
        : "tier_base";
  const planDefinitionSlug = (planSlugRaw.trim() || "tier_base").toLowerCase();

  try {
    const created = await createStoreWithOwner(c.env, {
      slug: slug.trim(),
      displayName: displayName.trim(),
      ownerUserId: user.id,
      customDomains,
      planDefinitionSlug,
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
