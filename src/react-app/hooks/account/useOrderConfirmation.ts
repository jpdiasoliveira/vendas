import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { apiFetch } from "@/react-app/services/api";
import { useToast } from "@/react-app/providers/ToastProvider";
import type { OrderWithItems } from "@/react-app/types";
import { orderLogistics } from "@/react-app/utils/orderDisplay";
import { buildTrackingExternalUrl } from "@/react-app/utils/trackingCarrierUrl";

const POLL_MS = 5000;

export function useOrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const guestEmail = searchParams.get("guestEmail") ?? searchParams.get("guest_email") ?? "";
  const mpResult = searchParams.get("mp_result");
  const { showToast } = useToast();

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const qs = useMemo(() => {
    if (!guestEmail.trim()) return "";
    return `?guestEmail=${encodeURIComponent(guestEmail.trim())}`;
  }, [guestEmail]);

  const load = useCallback(async () => {
    if (!orderId?.trim()) {
      setError("Pedido inválido.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<OrderWithItems>(`/api/orders/${encodeURIComponent(orderId.trim())}${qs}`);
      setOrder(data);
    } catch (err: unknown) {
      setOrder(null);
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível carregar o pedido. Verifique o link ou faça login em «Meus pedidos».";
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }, [orderId, qs, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!orderId?.trim()) return;
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load, orderId]);

  const stockConflict = Boolean(
    order?.metadata &&
      typeof order.metadata === "object" &&
      (order.metadata as Record<string, unknown>).insufficient_stock_at_payment === true,
  );

  const paymentApproved = order?.paymentStatus === "approved";
  const logistics = order ? orderLogistics(order.status ?? "") : { cancelled: false, shipped: false, delivered: false };
  const rawTracking = order?.trackingCode?.trim() ?? "";
  const trackingUrl = rawTracking ? buildTrackingExternalUrl(rawTracking) : "";
  const statusLower = (order?.status ?? "").toLowerCase();
  const isShippedStatus =
    statusLower === "shipped" ||
    statusLower === "enviado" ||
    statusLower === "delivered" ||
    statusLower === "entregue";

  const mpBanner =
    mpResult === "failure"
      ? "Pagamento não concluído. Você pode tentar novamente em «Meus pedidos» ou no carrinho."
      : mpResult === "pending"
        ? "Pagamento em análise. Esta página atualiza automaticamente."
        : null;

  const mpSuccessBanner =
    mpResult === "success"
      ? "Você voltou do Mercado Pago. Estamos confirmando o pagamento — a página atualiza sozinha em alguns segundos."
      : null;

  return {
    order,
    loading,
    error,
    guestEmail,
    stockConflict,
    paymentApproved,
    logistics,
    rawTracking,
    trackingUrl,
    isShippedStatus,
    mpBanner,
    mpSuccessBanner,
  };
}
