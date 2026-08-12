import { useMutation, useQueryClient } from "@tanstack/react-query";
import { platformEntitlementsPutBodySchema } from "@/schemas/platformEntitlements";
import {
  draftToPayload,
  type FeatureDraft,
} from "@/react-app/components/platform/plans/platformEntitlementsDraft";
import { useToast } from "@/react-app/providers/ToastProvider";
import { platformPlansCatalogQueryKey } from "@/react-app/query/queryKeys";
import { platformApiFetch, type PlatformPlansCatalogDto } from "@/react-app/services/api";

type SavePlansInput = {
  catalog: PlatformPlansCatalogDto;
  draftsByVersion: Record<string, Record<string, FeatureDraft>>;
  dirtyVersionIds: string[];
};

const persistDirtyVersions = async ({ catalog, draftsByVersion, dirtyVersionIds }: SavePlansInput) => {
  await Promise.all(
    dirtyVersionIds.map(async (versionId) => {
      const draft = draftsByVersion[versionId];
      if (!draft) return;
      const entitlements = draftToPayload(catalog.features, draft);
      const body = platformEntitlementsPutBodySchema.parse({ entitlements });
      await platformApiFetch(`/api/platform/plan-price-versions/${versionId}/entitlements`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    }),
  );
};

export const usePlatformPlansSaveMutation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: persistDirtyVersions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformPlansCatalogQueryKey });
      showToast({ type: "success", message: "Direitos dos planos atualizados com sucesso." });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Falha ao aplicar alterações nos planos.";
      showToast({ type: "error", message });
    },
  });
};
