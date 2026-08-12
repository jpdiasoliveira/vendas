import type { PlatformCatalogFeatureDto, PlatformPlansCatalogDto } from "@/react-app/services/api";
import type { PlatformEntitlementWriteRow } from "@/react-app/services/api";

export const TIER_LABEL: Record<string, string> = {
  tier_base: "Simples",
  tier_standard: "Pro",
  tier_unlimited: "VIP",
};

export type FeatureDraft = {
  enabled: boolean;
  unlimited: boolean;
  intStr: string;
  boolOn: boolean;
};

export const buildInitialDraft = (
  features: PlatformCatalogFeatureDto[],
  ent: { featureId: string; intValue: number | null; boolValue: boolean | null }[],
): Record<string, FeatureDraft> => {
  const byFeature = new Map(ent.map((row) => [row.featureId, row]));
  const out: Record<string, FeatureDraft> = {};
  for (const feature of features) {
    const row = byFeature.get(feature.id);
    const enabled = !!row;
    if (feature.valueKind === "boolean") {
      out[feature.id] = { enabled, unlimited: false, intStr: "0", boolOn: row?.boolValue === true };
    } else {
      const unlimited = enabled && row?.intValue == null;
      out[feature.id] = {
        enabled,
        unlimited,
        intStr: row?.intValue != null ? String(row.intValue) : "50",
        boolOn: false,
      };
    }
  }
  return out;
};

export const draftsFromCatalog = (catalog: PlatformPlansCatalogDto): Record<string, Record<string, FeatureDraft>> => {
  const drafts: Record<string, Record<string, FeatureDraft>> = {};
  for (const plan of catalog.plans) {
    const version = plan.publicPriceVersion;
    if (!version) continue;
    drafts[version.id] = buildInitialDraft(catalog.features, plan.entitlements);
  }
  return drafts;
};

export const draftToPayload = (
  features: PlatformCatalogFeatureDto[],
  draft: Record<string, FeatureDraft>,
): PlatformEntitlementWriteRow[] => {
  const payload: PlatformEntitlementWriteRow[] = [];
  for (const feature of features) {
    const row = draft[feature.id];
    if (!row?.enabled) continue;
    if (feature.valueKind === "boolean") {
      payload.push({ featureId: feature.id, intValue: null, boolValue: row.boolOn });
    } else if (row.unlimited) {
      payload.push({ featureId: feature.id, intValue: null, boolValue: null });
    } else {
      const value = Number(row.intStr);
      if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
        throw new Error(`Valor numérico inválido para “${feature.displayName}”.`);
      }
      payload.push({ featureId: feature.id, intValue: value, boolValue: null });
    }
  }
  return payload;
};

export const snapshotVersionDraft = (draft: Record<string, FeatureDraft>) => JSON.stringify(draft);

export const buildBaselineByVersion = (drafts: Record<string, Record<string, FeatureDraft>>) => {
  const baseline: Record<string, string> = {};
  for (const [versionId, draft] of Object.entries(drafts)) {
    baseline[versionId] = snapshotVersionDraft(draft);
  }
  return baseline;
};

export const getDirtyVersionIds = (
  draftsByVersion: Record<string, Record<string, FeatureDraft>>,
  baselineByVersion: Record<string, string>,
) =>
  Object.keys(draftsByVersion).filter(
    (versionId) => snapshotVersionDraft(draftsByVersion[versionId] ?? {}) !== (baselineByVersion[versionId] ?? ""),
  );
