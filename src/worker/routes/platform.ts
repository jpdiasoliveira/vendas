import { Hono } from "hono";
import { verifyPlatformOperator } from "../middlewares/verifyPlatformOperator.js";
import {
  addDomainsToStore,
  createStoreWithOwner,
  getPlatformAnalyticsOverview,
  getPlatformNewStoresByWeek,
  getPlatformPlansCatalog,
  getPlatformStoreRanking,
  getSubscriptionGraceDays,
  listPlatformStores,
  replaceEntitlementsForPriceVersion,
  upsertSubscriptionGraceDays,
} from "../core/database.js";
import type { Variables } from "../types.js";
import { genericServerErrorMessage, logServerError } from "../utils/safeApiError.js";
import { zodErrorToMessage } from "../utils/zodErrorMessage.js";
import { provisionStoreOwnerUser } from "../core/auth/provisionStoreOwnerUser.js";
import { getSupabase } from "../core/supabase.js";
import { platformCreateStoreBodySchema, normalizeStoreSlugInput } from "../../schemas/platformCreateStore.js";

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

platform.get("/analytics/new-stores-weekly", async (c) => {
  const raw = c.req.query("weeks");
  const n = raw != null && raw !== "" ? Number(raw) : 8;
  const weeks = Number.isFinite(n) ? Math.trunc(n) : 8;
  try {
    const data = await getPlatformNewStoresByWeek(c.env, weeks);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    logServerError("platform.get /analytics/new-stores-weekly", err);
    return c.json({ success: false, error: genericServerErrorMessage() }, 500);
  }
});

platform.get("/plans-catalog", async (c) => {
  try {
    const data = await getPlatformPlansCatalog(c.env);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    logServerError("platform.get /plans-catalog", err);
    return c.json({ success: false, error: genericServerErrorMessage() }, 500);
  }
});

platform.put("/plan-price-versions/:versionId/entitlements", async (c) => {
  const versionId = c.req.param("versionId");
  const body = (await c.req.json()) as { entitlements?: unknown };
  const raw = body.entitlements;
  if (!Array.isArray(raw)) {
    return c.json({ success: false, error: "Informe entitlements (array de linhas)." }, 400);
  }
  type Row = { featureId: string; intValue?: number | null; boolValue?: boolean | null };
  const entitlements: Row[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const fid =
      typeof o.featureId === "string"
        ? o.featureId
        : typeof o.feature_id === "string"
          ? o.feature_id
          : "";
    if (!fid) continue;
    const intRaw = o.intValue !== undefined ? o.intValue : o.int_value;
    const boolRaw = o.boolValue !== undefined ? o.boolValue : o.bool_value;
    entitlements.push({
      featureId: fid,
      intValue: intRaw === undefined ? undefined : intRaw === null ? null : Number(intRaw),
      boolValue: boolRaw === undefined ? undefined : boolRaw === null ? null : Boolean(boolRaw),
    });
  }
  try {
    await replaceEntitlementsForPriceVersion(c.env, versionId, entitlements);
    return c.json({ success: true, data: { ok: true } }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "VERSION_NOT_FOUND") {
      return c.json({ success: false, error: "Versão de preço não encontrada." }, 404);
    }
    if (msg === "VERSION_NOT_EDITABLE") {
      return c.json(
        { success: false, error: "Só é permitido editar entitlements de ofertas públicas e não aposentadas." },
        400
      );
    }
    if (msg.startsWith("FEATURE_UNKNOWN") || msg.includes("INVALID")) {
      return c.json({ success: false, error: "Dados de entitlement inválidos." }, 400);
    }
    logServerError("platform.put /plan-price-versions/:versionId/entitlements", err);
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
 * Cria loja (tenant), utilizador Auth do administrador, store_settings e vínculo owner em store_members.
 */
platform.post("/stores", async (c) => {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Corpo JSON inválido." }, 400);
  }

  const o = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const parsed = platformCreateStoreBodySchema.safeParse({
    slug: typeof o.slug === "string" ? o.slug : "",
    displayName:
      typeof o.displayName === "string"
        ? o.displayName
        : typeof o.display_name === "string"
          ? o.display_name
          : "",
    customDomains: Array.isArray(o.customDomains)
      ? o.customDomains
      : Array.isArray(o.custom_domains)
        ? o.custom_domains
        : [],
    ownerAdminName: typeof o.ownerAdminName === "string" ? o.ownerAdminName : "",
    ownerAdminEmail: typeof o.ownerAdminEmail === "string" ? o.ownerAdminEmail : "",
    sendPasswordSetupLink: Boolean(o.sendPasswordSetupLink),
    initialPassword: typeof o.initialPassword === "string" ? o.initialPassword : "",
    planSlug:
      typeof o.planSlug === "string"
        ? o.planSlug
        : typeof o.plan_definition_slug === "string"
          ? o.plan_definition_slug
          : "tier_base",
  });

  if (!parsed.success) {
    return c.json({ success: false, error: zodErrorToMessage(parsed.error) }, 400);
  }

  const b = parsed.data;
  const slug = normalizeStoreSlugInput(b.slug);
  const displayName = b.displayName.trim();
  const customDomains = (b.customDomains ?? [])
    .filter((d): d is string => typeof d === "string")
    .map((d) => d.trim())
    .filter(Boolean);
  const ownerEmail = b.ownerAdminEmail.trim().toLowerCase();
  const ownerName = b.ownerAdminName.trim();
  const planDefinitionSlug = b.planSlug;

  const supabase = getSupabase(c.env);
  const baseUrl = typeof c.env.STOREFRONT_BASE_URL === "string" ? c.env.STOREFRONT_BASE_URL.trim() : "";
  const redirectTo = baseUrl.length > 0 ? `${baseUrl.replace(/\/$/, "")}/auth/callback` : undefined;

  let ownerUserId: string | null = null;
  try {
    const { userId } = await provisionStoreOwnerUser(supabase, {
      email: ownerEmail,
      fullName: ownerName,
      sendPasswordSetupLink: b.sendPasswordSetupLink,
      initialPassword: b.initialPassword,
      redirectTo,
    });
    ownerUserId = userId;

    const created = await createStoreWithOwner(c.env, {
      slug,
      displayName,
      ownerUserId,
      customDomains,
      planDefinitionSlug,
    });
    return c.json({ success: true, data: created }, 201);
  } catch (err: unknown) {
    if (ownerUserId) {
      try {
        await supabase.auth.admin.deleteUser(ownerUserId);
      } catch {
        /* rollback best-effort */
      }
    }
    const msg = err instanceof Error ? err.message : genericServerErrorMessage();
    if (msg === "EMAIL_ALREADY_REGISTERED") {
      return c.json({ success: false, error: "Este e-mail já está registado. Usa outro ou convida o utilizador existente." }, 409);
    }
    if (msg === "DUPLICATE_SLUG" || msg.toLowerCase().includes("duplicate") || msg.includes("23505")) {
      return c.json({ success: false, error: "Já existe uma loja com este endereço. Escolhe outro." }, 409);
    }
    logServerError("platform.post /stores", err);
    return c.json({ success: false, error: msg.length < 120 ? msg : genericServerErrorMessage() }, 400);
  }
});

export default platform;
