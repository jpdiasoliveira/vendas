import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildBaselineByVersion,
  draftsFromCatalog,
  getDirtyVersionIds,
  type FeatureDraft,
} from "@/react-app/components/platform/plans/platformEntitlementsDraft";
import { usePlatformPlansCatalogQuery } from "@/react-app/hooks/platform/usePlatformPlansCatalogQuery";

export const usePlatformPlansEditor = () => {
  const catalogQuery = usePlatformPlansCatalogQuery();
  const catalog = catalogQuery.data ?? null;
  const [draftsByVersion, setDraftsByVersion] = useState<Record<string, Record<string, FeatureDraft>>>({});
  const [baselineByVersion, setBaselineByVersion] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!catalog) return;
    const drafts = draftsFromCatalog(catalog);
    setDraftsByVersion(drafts);
    setBaselineByVersion(buildBaselineByVersion(drafts));
  }, [catalog]);

  const dirtyVersionIds = useMemo(
    () => getDirtyVersionIds(draftsByVersion, baselineByVersion),
    [draftsByVersion, baselineByVersion],
  );

  const updateDraft = useCallback((versionId: string, featureId: string, patch: Partial<FeatureDraft>) => {
    setDraftsByVersion((prev) => {
      const planDraft = { ...(prev[versionId] ?? {}) };
      const current = planDraft[featureId] ?? {
        enabled: false,
        unlimited: false,
        intStr: "0",
        boolOn: false,
      };
      planDraft[featureId] = { ...current, ...patch };
      return { ...prev, [versionId]: planDraft };
    });
  }, []);

  return {
    catalog,
    isLoading: catalogQuery.isPending && catalogQuery.data === undefined,
    draftsByVersion,
    dirtyVersionIds,
    isDirty: dirtyVersionIds.length > 0,
    updateDraft,
    refetch: catalogQuery.refetch,
  };
};
