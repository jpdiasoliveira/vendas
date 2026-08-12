import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { platformRuntimeSettingsPatchSchema } from "@/schemas/platformRuntimeSettings";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useToast } from "@/react-app/providers/ToastProvider";
import { platformRuntimeSettingsQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";
import { platformApiFetch } from "@/react-app/services/api";

type RuntimeSettingsDto = { subscriptionGraceDays: number };

const fetchRuntimeSettings = () =>
  platformApiFetch<RuntimeSettingsDto>("/api/platform/runtime-settings");

export const usePlatformRuntimeSettings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: platformRuntimeSettingsQueryKey,
    queryFn: fetchRuntimeSettings,
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    retry: false,
    enabled: !!user,
  });

  useEffect(() => {
    if (!query.isError) return;
    const message =
      query.error instanceof Error ? query.error.message : "Não foi possível carregar as configurações.";
    showToast({ type: "error", message });
  }, [query.isError, query.error, showToast]);

  const mutation = useMutation({
    mutationFn: async (subscriptionGraceDays: number) => {
      const body = platformRuntimeSettingsPatchSchema.parse({ subscriptionGraceDays });
      return platformApiFetch<RuntimeSettingsDto>("/api/platform/runtime-settings", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformRuntimeSettingsQueryKey });
      showToast({ type: "success", message: "Carência de assinatura atualizada." });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Não foi possível salvar as configurações.";
      showToast({ type: "error", message });
    },
  });

  return {
    subscriptionGraceDays: query.data?.subscriptionGraceDays,
    isLoading: query.isPending && query.data === undefined,
    isSaving: mutation.isPending,
    refetch: query.refetch,
    saveGraceDays: mutation.mutateAsync,
  };
};
