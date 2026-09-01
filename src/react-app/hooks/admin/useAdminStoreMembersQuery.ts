import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import type { StoreMemberListItem } from "@/react-app/types";
import { adminStoreMembersQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";

export const useAdminStoreMembersQuery = () => {
  const { user } = useAuth();
  const slug = getEffectiveStoreSlug();

  return useQuery({
    queryKey: adminStoreMembersQueryKey(slug || "_"),
    queryFn: () => adminApiFetch<StoreMemberListItem[]>("/api/admin/members"),
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    retry: false,
    enabled: !!user,
  });
};
