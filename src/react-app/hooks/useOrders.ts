import { useState, useEffect } from "react";
import { apiFetch } from "@/react-app/services/api";
import type { Order } from "@/react-app/types";

export function useOrders(userAuthLoaded: boolean) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Busca a lista de pedidos do usuário na loja atual. */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<Order[]>("/api/orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar os pedidos. Tente novamente.";
      console.error("[useOrders.fetchOrders] Falha ao carregar pedidos:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userAuthLoaded) fetchOrders();
  }, [userAuthLoaded]);

  return { orders, loading, error, refreshOrders: fetchOrders };
}
