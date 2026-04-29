/**
 * Catálogo de planos + features + entitlements (Bloco 2) para operador da plataforma.
 * Escrita só em versões de preço públicas e não aposentadas — alinhado ao modelo de oferta vigente.
 */

import { getSupabase } from "../supabase.js";

export type CatalogFeature = {
  id: string;
  code: string;
  displayName: string;
  description: string | null;
  valueKind: "integer" | "boolean";
  sortOrder: number;
};

export type CatalogEntitlementRow = {
  featureId: string;
  featureCode: string;
  intValue: number | null;
  boolValue: boolean | null;
};

export type CatalogPlanTier = {
  planDefinitionId: string;
  slug: string;
  displayName: string;
  sortOrder: number;
  publicPriceVersion: {
    id: string;
    versionSeq: number;
    trialPeriodDays: number;
  } | null;
  entitlements: CatalogEntitlementRow[];
};

export type PlatformPlansCatalogPayload = {
  features: CatalogFeature[];
  plans: CatalogPlanTier[];
};

export type EntitlementUpsertInput = {
  featureId: string;
  intValue?: number | null;
  boolValue?: boolean | null;
};

function isMissingRelation(err: unknown): boolean {
  const code =
    typeof err === "object" && err != null && "code" in err ? String((err as { code?: unknown }).code ?? "") : "";
  const msg =
    typeof err === "object" && err != null && "message" in err
      ? String((err as { message?: unknown }).message ?? "")
      : "";
  return code === "42P01" || /does not exist|relation/i.test(msg);
}

export async function getPlatformPlansCatalog(env: Env): Promise<PlatformPlansCatalogPayload> {
  const supabase = getSupabase(env);

  const { data: featRows, error: fe } = await supabase
    .from("platform_features")
    .select("id, code, display_name, description, value_kind, sort_order")
    .order("sort_order", { ascending: true });

  if (fe) {
    if (isMissingRelation(fe)) return { features: [], plans: [] };
    throw new Error(fe.message);
  }

  const features: CatalogFeature[] = (featRows ?? []).map((r) => ({
    id: String(r.id),
    code: String(r.code ?? ""),
    displayName: String(r.display_name ?? ""),
    description: r.description != null ? String(r.description) : null,
    valueKind: r.value_kind === "boolean" ? "boolean" : "integer",
    sortOrder: Number(r.sort_order ?? 0),
  }));
  const codeByFeatureId = new Map(features.map((f) => [f.id, f.code]));

  const { data: defRows, error: de } = await supabase
    .from("platform_plan_definitions")
    .select("id, slug, display_name, sort_order, status")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (de) {
    if (isMissingRelation(de)) return { features, plans: [] };
    throw new Error(de.message);
  }

  const plans: CatalogPlanTier[] = [];

  for (const d of defRows ?? []) {
    const defId = String(d.id);
    const { data: ver, error: ve } = await supabase
      .from("platform_plan_price_versions")
      .select("id, version_seq, trial_period_days")
      .eq("plan_definition_id", defId)
      .eq("is_public_offer", true)
      .is("retired_at", null)
      .order("version_seq", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ve) {
      if (isMissingRelation(ve)) {
        plans.push({
          planDefinitionId: defId,
          slug: String(d.slug ?? ""),
          displayName: String(d.display_name ?? ""),
          sortOrder: Number(d.sort_order ?? 0),
          publicPriceVersion: null,
          entitlements: [],
        });
        continue;
      }
      throw new Error(ve.message);
    }

    let entitlements: CatalogEntitlementRow[] = [];
    let publicPriceVersion: CatalogPlanTier["publicPriceVersion"] = null;

    if (ver?.id) {
      const vid = String(ver.id);
      publicPriceVersion = {
        id: vid,
        versionSeq: Number(ver.version_seq ?? 1),
        trialPeriodDays: Number(ver.trial_period_days ?? 0),
      };
      const { data: entRows, error: ee } = await supabase
        .from("platform_plan_price_version_entitlements")
        .select("feature_id, int_value, bool_value")
        .eq("plan_price_version_id", vid);

      if (ee && !isMissingRelation(ee)) throw new Error(ee.message);

      entitlements = (entRows ?? []).map((e) => ({
        featureId: String(e.feature_id),
        featureCode: codeByFeatureId.get(String(e.feature_id)) ?? "",
        intValue: e.int_value != null && e.int_value !== undefined ? Number(e.int_value) : null,
        boolValue: typeof e.bool_value === "boolean" ? e.bool_value : null,
      }));
    }

    plans.push({
      planDefinitionId: defId,
      slug: String(d.slug ?? ""),
      displayName: String(d.display_name ?? ""),
      sortOrder: Number(d.sort_order ?? 0),
      publicPriceVersion,
      entitlements,
    });
  }

  return { features, plans };
}

export async function replaceEntitlementsForPriceVersion(
  env: Env,
  priceVersionId: string,
  rows: EntitlementUpsertInput[]
): Promise<void> {
  const supabase = getSupabase(env);
  const { data: ver, error: vErr } = await supabase
    .from("platform_plan_price_versions")
    .select("id, is_public_offer, retired_at")
    .eq("id", priceVersionId)
    .maybeSingle();

  if (vErr) throw new Error(vErr.message);
  if (!ver?.id) throw new Error("VERSION_NOT_FOUND");
  if (!ver.is_public_offer || ver.retired_at != null) throw new Error("VERSION_NOT_EDITABLE");

  const { error: delErr } = await supabase
    .from("platform_plan_price_version_entitlements")
    .delete()
    .eq("plan_price_version_id", priceVersionId);
  if (delErr) throw new Error(delErr.message);

  if (rows.length === 0) return;

  const featureIds = [...new Set(rows.map((r) => r.featureId))];
  const { data: kinds, error: kErr } = await supabase
    .from("platform_features")
    .select("id, value_kind")
    .in("id", featureIds);

  if (kErr) throw new Error(kErr.message);
  const kindById = new Map((kinds ?? []).map((k) => [String(k.id), String(k.value_kind ?? "integer")]));

  for (const r of rows) {
    const vk = kindById.get(r.featureId);
    if (!vk) throw new Error(`FEATURE_UNKNOWN:${r.featureId}`);
    if (vk === "integer") {
      if (r.boolValue != null) throw new Error("INVALID_ENTITLEMENT_SHAPE");
      if (r.intValue != null && (!Number.isFinite(r.intValue) || r.intValue < 0)) {
        throw new Error("INVALID_INT_VALUE");
      }
    } else {
      if (r.intValue != null) throw new Error("INVALID_ENTITLEMENT_SHAPE");
      if (typeof r.boolValue !== "boolean") throw new Error("BOOL_VALUE_REQUIRED");
    }
  }

  const insertRows = rows.map((r) => ({
    plan_price_version_id: priceVersionId,
    feature_id: r.featureId,
    int_value: kindById.get(r.featureId) === "integer" ? r.intValue ?? null : null,
    bool_value: kindById.get(r.featureId) === "boolean" ? r.boolValue! : null,
    updated_at: new Date().toISOString(),
  }));

  const { error: insErr } = await supabase.from("platform_plan_price_version_entitlements").insert(insertRows);
  if (insErr) throw new Error(insErr.message);
}
