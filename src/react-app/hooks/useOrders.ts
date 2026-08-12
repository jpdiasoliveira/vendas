import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/react-app/providers/ToastProvider";
import { apiFetch } from "@/react-app/services/api";
import type { Order } from "@/react-app/types";

export function useOrders(userAuthLoaded: boolean) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<Order[]>("/api/orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar os pedidos. Tente novamente.";
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (userAuthLoaded) void fetchOrders();
  }, [userAuthLoaded, fetchOrders]);

  return { orders, loading, error, refreshOrders: fetchOrders };
}
