import { useEffect, useRef } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { adminApiFetch } from "@/react-app/services/api";
import type { Order } from "@/react-app/types";
import { ACTIVE_STATUSES, getOrderStatus } from "@/react-app/utils/adminOrders";

const playNewOrderSound = () => {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

export function useOrderPolling(
  activeTab: "ativos" | "historico",
  orders: Order[],
  listKey: readonly unknown[],
  queryClient: QueryClient,
) {
  const previousActiveOrderIdsRef = useRef<Set<string>>(new Set());
  const pollingInitializedRef = useRef(false);

  useEffect(() => {
    if (orders.length === 0 || pollingInitializedRef.current) return;
    const active = orders.filter((o) => ACTIVE_STATUSES.includes(getOrderStatus(o)));
    previousActiveOrderIdsRef.current = new Set(active.map((o) => o.id));
    pollingInitializedRef.current = true;
  }, [orders]);

  useEffect(() => {
    if (activeTab !== "ativos") return;

    const tick = () => {
      void (async () => {
        const list = await queryClient.fetchQuery({
          queryKey: listKey,
          queryFn: async () => {
            const data = await adminApiFetch<Order[]>("/api/admin/orders");
            return Array.isArray(data) ? data : [];
          },
          staleTime: 0,
        });
        const active = list.filter((o) => ACTIVE_STATUSES.includes(getOrderStatus(o)));
        const currentIds = new Set(active.map((o) => o.id));
        const prev = previousActiveOrderIdsRef.current;
        const hasNew = currentIds.size > 0 && [...currentIds].some((id) => !prev.has(id));
        if (hasNew && prev.size > 0) playNewOrderSound();
        previousActiveOrderIdsRef.current = currentIds;
        queryClient.setQueryData(listKey, list);
      })();
    };

    let intervalId: ReturnType<typeof setInterval> | undefined;
    const arm = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = undefined;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      intervalId = setInterval(tick, 45_000);
    };
    const onVis = () => {
      if (document.visibilityState === "visible") arm();
      else if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    arm();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab, listKey, queryClient]);
}
