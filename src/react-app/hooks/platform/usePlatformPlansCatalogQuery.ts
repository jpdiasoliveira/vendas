import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useToast } from "@/react-app/providers/ToastProvider";
import { platformPlansCatalogQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";
import { platformApiFetch, type PlatformPlansCatalogDto } from "@/react-app/services/api";

const fetchPlatformPlansCatalog = () =>
  platformApiFetch<PlatformPlansCatalogDto>("/api/platform/plans-catalog");

export const usePlatformPlansCatalogQuery = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const query = useQuery({
    queryKey: platformPlansCatalogQueryKey,
    queryFn: fetchPlatformPlansCatalog,
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    retry: false,
    enabled: !!user,
  });

  useEffect(() => {
    if (!query.isError) return;
    const message =
      query.error instanceof Error ? query.error.message : "Não foi possível carregar o catálogo de planos.";
    showToast({ type: "error", message });
  }, [query.isError, query.error, showToast]);

  return query;
};
