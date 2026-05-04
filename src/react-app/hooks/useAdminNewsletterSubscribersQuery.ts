import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { fetchAdminNewsletterSubscribersPage, getEffectiveStoreSlug } from "@/react-app/services/api";
import { adminNewsletterSubscribersQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";

const PAGE_SIZE = 50;

type UseAdminNewsletterSubscribersQueryOpts = {
  page: number;
  enabled?: boolean;
};

export const useAdminNewsletterSubscribersQuery = (opts: UseAdminNewsletterSubscribersQueryOpts) => {
  const { user } = useAuth();
  const slug = getEffectiveStoreSlug();
  const page = Math.max(0, opts.page);
  const offset = page * PAGE_SIZE;
  const enabled = (opts.enabled ?? true) && !!user;

  return useQuery({
    queryKey: adminNewsletterSubscribersQueryKey(slug || "_", PAGE_SIZE, offset),
    queryFn: () => fetchAdminNewsletterSubscribersPage({ limit: PAGE_SIZE, offset }),
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    retry: false,
    enabled,
  });
};

export const NEWSLETTER_ADMIN_PAGE_SIZE = PAGE_SIZE;
