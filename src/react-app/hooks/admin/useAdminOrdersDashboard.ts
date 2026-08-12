import { useQuery } from "@tanstack/react-query";
import { adminApiFetch, apiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import type { Product } from "@/react-app/types";
import type { AuditLogReport } from "@/shared/types";
import { adminOrdersDashboardQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";

type DashboardData = {
  topSellerNames: string[];
  latestLogs: AuditLogReport[];
};

export function useAdminOrdersDashboard() {
  const storeSlug = getEffectiveStoreSlug() || "_";

  return useQuery({
    queryKey: adminOrdersDashboardQueryKey(storeSlug),
    queryFn: async (): Promise<DashboardData> => {
      const [trendingIds, products, logs] = await Promise.all([
        apiFetch<string[]>("/api/products/trending"),
        adminApiFetch<Product[]>("/api/admin/products"),
        adminApiFetch<AuditLogReport[]>("/api/admin/audit-logs"),
      ]);
      const nameById = new Map((products ?? []).map((p) => [p.id, p.name]));
      const topSellerNames = (trendingIds ?? [])
        .map((id) => nameById.get(id))
        .filter((n): n is string => typeof n === "string" && n.trim().length > 0)
        .slice(0, 3);
      return {
        topSellerNames,
        latestLogs: Array.isArray(logs) ? logs.slice(0, 5) : [],
      };
    },
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    retry: false,
  });
}
