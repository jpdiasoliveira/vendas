import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
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
import { platformCreateStoreRequestSchema, normalizeStoreSlugInput } from "../../schemas/platformCreateStore.js";
import { platformEntitlementsPutBodySchema } from "../../schemas/platformEntitlements.js";
import { platformRuntimeSettingsPatchSchema } from "../../schemas/platformRuntimeSettings.js";
import { platformStoreDomainsBodySchema } from "../../schemas/platformStoreDomains.js";

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

platform.patch(
  "/runtime-settings",
  zValidator("json", platformRuntimeSettingsPatchSchema, (result, c) => {
    if (!result.success) {
      return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
    }
  }),
  async (c) => {
    const { subscriptionGraceDays } = c.req.valid("json");
    try {
      const saved = await upsertSubscriptionGraceDays(c.env, subscriptionGraceDays);
      return c.json({ success: true, data: { subscriptionGraceDays: saved } }, 200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "INVALID_GRACE_DAYS") {
        return c.json({ success: false, error: "Carência inválida. Use um inteiro entre 0 e 90 dias." }, 400);
      }
      logServerError("platform.patch /runtime-settings", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  },
);

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

platform.put(
  "/plan-price-versions/:versionId/entitlements",
  zValidator("json", platformEntitlementsPutBodySchema, (result, c) => {
    if (!result.success) {
      return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
    }
  }),
  async (c) => {
    const versionId = c.req.param("versionId");
    const { entitlements } = c.req.valid("json");
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
          400,
        );
      }
      if (msg.startsWith("FEATURE_UNKNOWN") || msg.includes("INVALID")) {
        return c.json({ success: false, error: "Dados de entitlement inválidos." }, 400);
      }
      logServerError("platform.put /plan-price-versions/:versionId/entitlements", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  },
);

platform.post(
  "/stores/:storeId/domains",
  zValidator("json", platformStoreDomainsBodySchema, (result, c) => {
    if (!result.success) {
      return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
    }
  }),
  async (c) => {
    const storeId = c.req.param("storeId");
    const { domains, setPrimaryFirst } = c.req.valid("json");
    try {
      await addDomainsToStore(c.env, {
        storeId,
        domains,
        setPrimaryFirst: setPrimaryFirst === true,
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
  },
);

/**
 * Cria loja (tenant), utilizador Auth do administrador, store_settings e vínculo owner em store_members.
 */
platform.post(
  "/stores",
  zValidator("json", platformCreateStoreRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
    }
  }),
  async (c) => {
    const b = c.req.valid("json");
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
  },
);

export default platform;
