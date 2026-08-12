import { useQuery } from "@tanstack/react-query";
import { adminApiFetch } from "@/react-app/services/api";
import type { OrderDetail } from "@/react-app/types";
import { adminOrderDetailQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";
import { normalizeOrderDetail } from "@/react-app/utils/admin/orderDetails";

const queryErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : err ? String(err) : null;

export function useAdminOrderDetailQueries(
  storeSlug: string,
  user: unknown,
  expandedOrderId: string | null,
  selectedOrderId: string | null,
  drawerOpen: boolean,
) {
  const expandedDetailQuery = useQuery({
    queryKey: adminOrderDetailQueryKey(storeSlug, expandedOrderId ?? ""),
    queryFn: async () => {
      const data = await adminApiFetch<OrderDetail>(`/api/admin/orders/${expandedOrderId}`);
      return normalizeOrderDetail(data);
    },
    enabled: !!expandedOrderId && !!user,
    staleTime: ADMIN_PANEL_STALE_MS,
    retry: false,
  });

  const drawerDetailQuery = useQuery({
    queryKey: adminOrderDetailQueryKey(storeSlug, selectedOrderId ?? ""),
    queryFn: async () => {
      const data = await adminApiFetch<OrderDetail>(`/api/admin/orders/${selectedOrderId}`);
      return normalizeOrderDetail(data);
    },
    enabled: drawerOpen && !!selectedOrderId && !!user,
    staleTime: ADMIN_PANEL_STALE_MS,
    retry: false,
  });

  return {
    expandedOrder: expandedDetailQuery.data ?? null,
    expandedLoading: expandedDetailQuery.isPending,
    expandedError: expandedDetailQuery.isError,
    drawerOrder: drawerDetailQuery.data ?? null,
    drawerLoading: drawerDetailQuery.isPending,
    drawerError: queryErrorMessage(drawerDetailQuery.error),
  };
}
