import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import type { StoreCoupon } from "@/react-app/types";
import { adminCouponsQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";

export const useAdminCouponsQuery = () => {
  const { user } = useAuth();
  const slug = getEffectiveStoreSlug();

  return useQuery({
    queryKey: adminCouponsQueryKey(slug || "_"),
    queryFn: () => adminApiFetch<StoreCoupon[]>("/api/admin/coupons"),
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    retry: false,
    enabled: !!user,
  });
};
