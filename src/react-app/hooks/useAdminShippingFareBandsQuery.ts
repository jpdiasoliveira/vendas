import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import type { ShippingFareBand } from "@/react-app/types";
import { adminShippingFareBandsQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";

export const useAdminShippingFareBandsQuery = () => {
  const { user } = useAuth();
  const slug = getEffectiveStoreSlug();

  return useQuery({
    queryKey: adminShippingFareBandsQueryKey(slug || "_"),
    queryFn: () => adminApiFetch<ShippingFareBand[]>("/api/admin/shipping-fare-bands"),
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    retry: false,
    enabled: !!user,
  });
};
