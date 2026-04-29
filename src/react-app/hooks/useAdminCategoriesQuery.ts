import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import type { Category } from "@/react-app/types";
import { adminCategoriesQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";

type UseAdminCategoriesQueryOpts = {
  /** Se false, não dispara fetch até estar true (ex.: modal fechado). */
  enabled?: boolean;
};

export const useAdminCategoriesQuery = (opts?: UseAdminCategoriesQueryOpts) => {
  const { user } = useAuth();
  const slug = getEffectiveStoreSlug();
  const enabled = (opts?.enabled ?? true) && !!user;

  return useQuery({
    queryKey: adminCategoriesQueryKey(slug || "_"),
    queryFn: () => adminApiFetch<Category[]>("/api/admin/categories"),
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    retry: false,
    enabled,
  });
};
