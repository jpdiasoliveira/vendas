import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import type { Order } from "@/react-app/types";
import { adminOrdersQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";
import {
  ACTIVE_STATUSES,
  filterOrdersByPeriod,
  getOrderStatus,
  HISTORY_STATUSES,
  isAwaitingShipment,
  type HistoryPeriodFilter,
} from "@/react-app/utils/adminOrders";
import { useOrderPolling } from "@/react-app/hooks/admin/useOrderPolling";
import { useAdminOrderDetailQueries } from "@/react-app/hooks/admin/useAdminOrderDetailQueries";

const queryErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : err ? String(err) : null;

export function useAdminOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const storeSlug = getEffectiveStoreSlug() || "_";
  const listKey = adminOrdersQueryKey(storeSlug);

  const ordersQuery = useQuery({
    queryKey: listKey,
    queryFn: async () => {
      const data = await adminApiFetch<Order[]>("/api/admin/orders");
      return Array.isArray(data) ? data : [];
    },
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    retry: false,
    enabled: !!user,
    refetchInterval: false,
  });

  const orders = ordersQuery.data ?? [];
  const loading = ordersQuery.isPending && ordersQuery.data === undefined;
  const error = queryErrorMessage(ordersQuery.error);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ativos" | "historico">("ativos");
  const [searchQuery, setSearchQuery] = useState("");
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState<HistoryPeriodFilter>("todos");

  const activeOrders = useMemo(
    () => orders.filter((o) => ACTIVE_STATUSES.includes(getOrderStatus(o))),
    [orders],
  );
  const historyOrders = useMemo(
    () => orders.filter((o) => HISTORY_STATUSES.includes(getOrderStatus(o))),
    [orders],
  );
  const historyOrdersByPeriod = useMemo(
    () => filterOrdersByPeriod(historyOrders, historyPeriodFilter),
    [historyOrders, historyPeriodFilter],
  );
  const ordersByTab = activeTab === "ativos" ? activeOrders : historyOrdersByPeriod;
  const displayedOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ordersByTab;
    return ordersByTab.filter((o) => (o.customerName ?? "").toLowerCase().includes(q));
  }, [ordersByTab, searchQuery]);

  const historyPeriodSummary = useMemo(() => {
    const total = displayedOrders.reduce((acc, o) => acc + (o.total ?? 0), 0);
    return { total, count: displayedOrders.length };
  }, [displayedOrders]);

  const awaitingShipmentCount = activeOrders.filter(isAwaitingShipment).length;
  const trackingOrder = trackingOrderId ? orders.find((o) => o.id === trackingOrderId) : undefined;

  const details = useAdminOrderDetailQueries(
    storeSlug,
    user,
    expandedOrderId,
    selectedOrderId,
    drawerOpen,
  );

  useOrderPolling(activeTab, orders, listKey, queryClient);

  const refetchOrders = useCallback(() => {
    void ordersQuery.refetch();
  }, [ordersQuery]);

  const openDetail = useCallback((id: string) => {
    setSelectedOrderId(id);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedOrderId(null);
  }, []);

  const handleExpandOrder = useCallback(
    (orderId: string) => {
      if (expandedOrderId === orderId) {
        setExpandedOrderId(null);
        return;
      }
      setExpandedOrderId(orderId);
    },
    [expandedOrderId],
  );

  return {
    orders,
    loading,
    error,
    refetchOrders,
    selectedOrderId,
    drawerOpen,
    closeDrawer,
    drawerOrder: details.drawerOrder,
    drawerLoading: details.drawerLoading,
    drawerError: details.drawerError,
    trackingOrderId,
    setTrackingOrderId,
    trackingOrder,
    expandedOrderId,
    expandedOrder: details.expandedOrder,
    expandedLoading: details.expandedLoading,
    expandedError: details.expandedError,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    historyPeriodFilter,
    setHistoryPeriodFilter,
    activeOrders,
    historyOrders,
    displayedOrders,
    historyPeriodSummary,
    awaitingShipmentCount,
    openDetail,
    handleExpandOrder,
  };
}
