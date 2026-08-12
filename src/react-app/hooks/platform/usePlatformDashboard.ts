import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useToast } from "@/react-app/providers/ToastProvider";
import { platformDashboardQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";
import {
  platformApiFetch,
  type PlatformAnalyticsOverviewDto,
  type PlatformNewStoresWeekBucketDto,
  type PlatformStoreRankingRowDto,
} from "@/react-app/services/api";
import { defaultPlatformOverview } from "@/react-app/components/platform/dashboard/platformDashboardUtils";

export type PlatformDashboardData = {
  overview: PlatformAnalyticsOverviewDto;
  ranking: PlatformStoreRankingRowDto[];
  weeklyBuckets: PlatformNewStoresWeekBucketDto[];
};

const fetchPlatformDashboard = async (): Promise<PlatformDashboardData> => {
  const [overview, ranking, weeklyBuckets] = await Promise.all([
    platformApiFetch<PlatformAnalyticsOverviewDto>("/api/platform/analytics/overview"),
    platformApiFetch<PlatformStoreRankingRowDto[]>("/api/platform/analytics/store-ranking?limit=10"),
    platformApiFetch<PlatformNewStoresWeekBucketDto[]>("/api/platform/analytics/new-stores-weekly?weeks=8"),
  ]);
  return { overview, ranking, weeklyBuckets };
};

export const usePlatformDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const query = useQuery({
    queryKey: platformDashboardQueryKey,
    queryFn: fetchPlatformDashboard,
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    retry: false,
    enabled: !!user,
  });

  useEffect(() => {
    if (!query.isError) return;
    const message =
      query.error instanceof Error
        ? query.error.message
        : "Não foi possível carregar os dados do dashboard.";
    showToast({ type: "error", message });
  }, [query.isError, query.error, showToast]);

  const overview = query.data?.overview ?? defaultPlatformOverview;
  const ranking = query.data?.ranking ?? [];
  const weeklyBuckets = query.data?.weeklyBuckets ?? [];

  return {
    overview,
    ranking,
    weeklyBuckets,
    isLoading: query.isPending && query.data === undefined,
    isRefetching: query.isFetching && query.data !== undefined,
    refetch: query.refetch,
    isError: query.isError,
  };
};
