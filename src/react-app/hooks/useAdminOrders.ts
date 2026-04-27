import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { adminApiFetch } from "@/react-app/services/api";
import type { Order, OrderDetail } from "@/react-app/types";
import {
  ACTIVE_STATUSES,
  filterOrdersByPeriod,
  getOrderStatus,
  HISTORY_STATUSES,
  isAwaitingShipment,
  type HistoryPeriodFilter,
} from "@/react-app/utils/adminOrders";

const playNewOrderSound = () => {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    /* ignore */
  }
};

export const useAdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderDetailsCache, setOrderDetailsCache] = useState<Record<string, OrderDetail>>({});
  const [loadingItemsOrderId, setLoadingItemsOrderId] = useState<string | null>(null);
  const [itemsErrorOrderId, setItemsErrorOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ativos" | "historico">("ativos");
  const [searchQuery, setSearchQuery] = useState("");
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState<HistoryPeriodFilter>("todos");
  const [historyDetailOrderId, setHistoryDetailOrderId] = useState<string | null>(null);

  const activeOrders = useMemo(
    () => orders.filter((o) => ACTIVE_STATUSES.includes(getOrderStatus(o))),
    [orders]
  );
  const historyOrders = useMemo(
    () => orders.filter((o) => HISTORY_STATUSES.includes(getOrderStatus(o))),
    [orders]
  );
  const historyOrdersByPeriod = useMemo(
    () => filterOrdersByPeriod(historyOrders, historyPeriodFilter),
    [historyOrders, historyPeriodFilter]
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

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await adminApiFetch<Order[]>("/api/admin/orders");
      const list = Array.isArray(data) ? data : [];
      if (!silent) setOrders(list);
      return list;
    } catch (err: unknown) {
      if (!silent) setError(err instanceof Error ? err.message : "Erro ao carregar pedidos");
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const previousActiveOrderIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    void fetchOrders().then((list) => {
      if (mounted) {
        const active = list.filter((o) => ACTIVE_STATUSES.includes(getOrderStatus(o)));
        previousActiveOrderIdsRef.current = new Set(active.map((o) => o.id));
      }
    });
    return () => {
      mounted = false;
    };
  }, [fetchOrders]);

  useEffect(() => {
    if (activeTab !== "ativos") return;
    const interval = setInterval(() => {
      void (async () => {
        const list = await fetchOrders(true);
        const active = list.filter((o) => ACTIVE_STATUSES.includes(getOrderStatus(o)));
        const currentIds = new Set(active.map((o) => o.id));
        const prev = previousActiveOrderIdsRef.current;
        const hasNew = currentIds.size > 0 && [...currentIds].some((id) => !prev.has(id));
        if (hasNew && prev.size > 0) playNewOrderSound();
        previousActiveOrderIdsRef.current = currentIds;
        setOrders(list);
      })();
    }, 45_000);
    return () => clearInterval(interval);
  }, [activeTab, fetchOrders]);

  const openDetail = useCallback((id: string) => {
    setSelectedOrderId(id);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedOrderId(null);
  }, []);

  const handleExpandOrder = useCallback(async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setItemsErrorOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    setItemsErrorOrderId(null);
    if (orderDetailsCache[orderId]) return;
    setLoadingItemsOrderId(orderId);
    try {
      const data = await adminApiFetch<OrderDetail>(`/api/admin/orders/${orderId}`);
      setOrderDetailsCache((prev) => ({ ...prev, [orderId]: data }));
    } catch (err: unknown) {
      setItemsErrorOrderId(orderId);
      console.error("[useAdminOrders.handleExpandOrder]", orderId, err);
    } finally {
      setLoadingItemsOrderId(null);
    }
  }, [expandedOrderId, orderDetailsCache]);

  const trackingOrder = trackingOrderId ? orders.find((o) => o.id === trackingOrderId) : undefined;

  return {
    orders,
    loading,
    error,
    selectedOrderId,
    modalOpen,
    trackingOrderId,
    trackingOrder,
    expandedOrderId,
    orderDetailsCache,
    loadingItemsOrderId,
    itemsErrorOrderId,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    historyPeriodFilter,
    setHistoryPeriodFilter,
    historyDetailOrderId,
    setHistoryDetailOrderId,
    activeOrders,
    historyOrders,
    displayedOrders,
    historyPeriodSummary,
    awaitingShipmentCount,
    fetchOrders,
    openDetail,
    closeModal,
    handleExpandOrder,
    setTrackingOrderId,
  };
};
