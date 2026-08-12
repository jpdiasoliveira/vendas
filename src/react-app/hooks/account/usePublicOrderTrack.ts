import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { fetchGuestOrder } from "@/react-app/hooks/account/fetchGuestOrder";
import { useToast } from "@/react-app/providers/ToastProvider";
import type { OrderWithItems } from "@/react-app/types";
import { orderLogistics } from "@/react-app/utils/orderDisplay";
import { buildTrackingExternalUrl } from "@/react-app/utils/trackingCarrierUrl";

const POLL_MS = 8000;

export function usePublicOrderTrack() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const orderIdFromUrl = searchParams.get("orderId")?.trim() ?? "";
  const guestEmailFromUrl = searchParams.get("guestEmail")?.trim() ?? "";

  const [orderIdInput, setOrderIdInput] = useState(orderIdFromUrl);
  const [emailInput, setEmailInput] = useState(guestEmailFromUrl);
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(false);

  const activeOrderId = orderIdFromUrl || orderIdInput.trim();
  const activeEmail = guestEmailFromUrl || emailInput.trim();

  const load = useCallback(async () => {
    if (!activeOrderId || !activeEmail) {
      setOrder(null);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchGuestOrder(activeOrderId, activeEmail);
      setOrder(data);
    } catch (err: unknown) {
      setOrder(null);
      const message =
        err instanceof Error
          ? err.message
          : "Não encontramos este pedido. Confira o número do pedido e o e-mail usados na compra.";
      showToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }, [activeOrderId, activeEmail, showToast]);

  useEffect(() => {
    if (orderIdFromUrl && guestEmailFromUrl) {
      setOrderIdInput(orderIdFromUrl);
      setEmailInput(guestEmailFromUrl);
    }
  }, [orderIdFromUrl, guestEmailFromUrl]);

  useEffect(() => {
    if (activeOrderId && activeEmail) void load();
    else setOrder(null);
  }, [activeOrderId, activeEmail, load]);

  useEffect(() => {
    if (!activeOrderId || !activeEmail) return;
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load, activeOrderId, activeEmail]);

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const oid = orderIdInput.trim();
      const em = emailInput.trim();
      if (!oid || !em) {
        showToast({ type: "error", message: "Preencha o número do pedido e o e-mail." });
        return;
      }
      navigate(
        `/pedido/acompanhar?orderId=${encodeURIComponent(oid)}&guestEmail=${encodeURIComponent(em)}`,
        { replace: true },
      );
    },
    [orderIdInput, emailInput, navigate, showToast],
  );

  const paymentApproved = order?.paymentStatus === "approved";
  const logistics = order ? orderLogistics(order.status ?? "") : { cancelled: false, shipped: false, delivered: false };
  const rawTracking = order?.trackingCode?.trim() ?? "";
  const trackingUrl = rawTracking ? buildTrackingExternalUrl(rawTracking) : "";
  const preparing = paymentApproved && !logistics.shipped && !logistics.cancelled;

  const showLoading = loading && Boolean(activeOrderId && activeEmail) && !order;

  return {
    orderIdInput,
    setOrderIdInput,
    emailInput,
    setEmailInput,
    order,
    showLoading,
    activeOrderId,
    activeEmail,
    handleSubmit,
    paymentApproved,
    logistics,
    rawTracking,
    trackingUrl,
    preparing,
  };
}
