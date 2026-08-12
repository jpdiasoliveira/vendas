import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { usePlatformShell } from "@/react-app/contexts/PlatformShellContext";
import { useToast } from "@/react-app/providers/ToastProvider";
import { platformStoresQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";
import {
  platformApiFetch,
  type PlatformStoreOverview,
  type PlatformStoreRankingRowDto,
} from "@/react-app/services/api";

type PlatformStoresData = {
  stores: PlatformStoreOverview[];
  ranking: PlatformStoreRankingRowDto[];
};

const fetchPlatformStoresData = async (): Promise<PlatformStoresData> => {
  const [stores, ranking] = await Promise.all([
    platformApiFetch<PlatformStoreOverview[]>("/api/platform/stores"),
    platformApiFetch<PlatformStoreRankingRowDto[]>("/api/platform/analytics/store-ranking?limit=50"),
  ]);
  return { stores, ranking };
};

const filterStores = (stores: PlatformStoreOverview[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return stores;
  return stores.filter((store) => {
    const email = (store.ownerEmail ?? "").toLowerCase();
    return (
      store.displayName.toLowerCase().includes(q) ||
      store.slug.toLowerCase().includes(q) ||
      email.includes(q)
    );
  });
};

export const usePlatformStores = (search: string) => {
  const { user } = useAuth();
  const { storesListVersion } = usePlatformShell();
  const { showToast } = useToast();

  const query = useQuery({
    queryKey: [...platformStoresQueryKey, storesListVersion],
    queryFn: fetchPlatformStoresData,
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    retry: false,
    enabled: !!user,
  });

  useEffect(() => {
    if (!query.isError) return;
    const message =
      query.error instanceof Error ? query.error.message : "Não foi possível carregar a lista de lojas.";
    showToast({ type: "error", message });
  }, [query.isError, query.error, showToast]);

  const gmvByStoreId = useMemo(() => {
    const map = new Map<string, PlatformStoreRankingRowDto>();
    for (const row of query.data?.ranking ?? []) map.set(row.storeId, row);
    return map;
  }, [query.data?.ranking]);

  const stores = query.data?.stores ?? [];
  const filteredStores = useMemo(() => filterStores(stores, search), [stores, search]);

  return {
    stores: filteredStores,
    totalCount: stores.length,
    gmvByStoreId,
    isLoading: query.isPending && query.data === undefined,
    isRefetching: query.isFetching && query.data !== undefined,
    refetch: query.refetch,
  };
};
