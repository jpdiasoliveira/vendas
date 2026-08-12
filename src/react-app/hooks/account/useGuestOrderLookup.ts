import { useCallback, useEffect, useState } from "react";
import { fetchGuestOrder } from "@/react-app/hooks/account/fetchGuestOrder";
import { useOrderPayment } from "@/react-app/hooks/account/useOrderPayment";
import { useToast } from "@/react-app/providers/ToastProvider";
import type { OrderWithItems } from "@/react-app/types";
import { guestEmailOk, orderIdOk } from "@/react-app/utils/orderDisplay";

export function useGuestOrderLookup(isOpen: boolean, onClose: () => void) {
  const { showToast } = useToast();
  const [orderIdInput, setOrderIdInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [copied, setCopied] = useState(false);

  const refreshOrder = useCallback(async () => {
    const oid = orderIdInput.trim();
    const em = emailInput.trim();
    if (!orderIdOk(oid) || !guestEmailOk(em)) return;
    setLoading(true);
    try {
      const data = await fetchGuestOrder(oid, em);
      setOrder(data);
    } catch (err: unknown) {
      console.error("[useGuestOrderLookup.refreshOrder]", err);
    } finally {
      setLoading(false);
    }
  }, [orderIdInput, emailInput]);

  const payment = useOrderPayment(() => void refreshOrder());

  const reset = useCallback(() => {
    setOrderIdInput("");
    setEmailInput("");
    setLoading(false);
    setOrder(null);
    setCopied(false);
    payment.closePayment();
  }, [payment]);

  useEffect(() => {
    if (!isOpen && !payment.isOpen) reset();
  }, [isOpen, payment.isOpen, reset]);

  const searchOrder = useCallback(async () => {
    const oid = orderIdInput.trim();
    const em = emailInput.trim();
    if (!orderIdOk(oid) || !guestEmailOk(em)) {
      const message = "Informe o número do pedido e o e-mail usados na compra.";
      showToast({ type: "error", message });
      return;
    }
    setLoading(true);
    setOrder(null);
    try {
      const data = await fetchGuestOrder(oid, em);
      setOrder(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Não encontramos pedido com estes dados. Confira o número do pedido e o e-mail.";
      showToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }, [orderIdInput, emailInput, showToast]);

  const copyOrderId = useCallback(async () => {
    if (!order?.id) return;
    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast({ type: "error", message: "Não foi possível copiar o número do pedido." });
    }
  }, [order?.id, showToast]);

  const startNewSearch = useCallback(() => setOrder(null), []);

  const requestClose = useCallback(() => {
    if (payment.isOpen) return;
    onClose();
  }, [payment.isOpen, onClose]);

  const openPayment = useCallback(() => {
    if (!order) return;
    payment.openPayment(order.id, order.total, emailInput.trim());
  }, [order, emailInput, payment]);

  const canPay =
    order != null && order.status === "pending" && (!order.paymentStatus || order.paymentStatus === "pending");

  const keepMounted = isOpen || payment.isOpen;

  return {
    orderIdInput,
    setOrderIdInput,
    emailInput,
    setEmailInput,
    loading,
    order,
    copied,
    payment,
    searchOrder,
    copyOrderId,
    startNewSearch,
    requestClose,
    openPayment,
    canPay,
    keepMounted,
    guestEmail: emailInput.trim(),
  };
}
