import { useState, useEffect, useCallback } from "react";
import { adminApiFetch } from "@/react-app/services/api";
import type { OrderDetail } from "@/react-app/types";
import {
  STATUS_OPTIONS,
  orderStatusSelectSource,
  statusToSelectValue,
} from "@/react-app/components/admin/orderDetailsModalHelpers";

const normalizeOrderDetail = (data: OrderDetail): OrderDetail => ({
  ...data,
  items: Array.isArray(data.items) ? data.items : [],
});

type SyncPaymentData = {
  message: string;
  mpStatus: string;
  resultKind: string;
  outcome?: string;
  order: OrderDetail | null;
};

export interface UseOrderDetailsModalArgs {
  isOpen: boolean;
  orderId: string | null;
  onStatusUpdated: () => void;
}

export const useOrderDetailsModal = ({
  isOpen,
  orderId,
  onStatusUpdated,
}: UseOrderDetailsModalArgs) => {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [statusSuccessMessage, setStatusSuccessMessage] = useState<string | null>(null);
  const [syncPaymentLoading, setSyncPaymentLoading] = useState(false);
  const [syncPaymentMessage, setSyncPaymentMessage] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  useEffect(() => {
    if (!isOpen || !orderId) {
      setOrder(null);
      setError(null);
      setStatusSuccessMessage(null);
      setCancellationReason("");
      return;
    }
    setLoading(true);
    setError(null);
    setStatusSuccessMessage(null);
    setSyncPaymentMessage(null);
    setCancellationReason("");
    adminApiFetch<OrderDetail>(`/api/admin/orders/${orderId}`)
      .then((data) => {
        const normalized = normalizeOrderDetail(data);
        setOrder(normalized);
        setSelectedStatus(
          statusToSelectValue(orderStatusSelectSource(normalized.paymentStatus, normalized.status))
        );
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Erro ao carregar pedido");
      })
      .finally(() => setLoading(false));
  }, [isOpen, orderId]);

  const handleSyncPayment = useCallback(async () => {
    if (!orderId) return;
    setSyncPaymentLoading(true);
    setError(null);
    setSyncPaymentMessage(null);
    setStatusSuccessMessage(null);
    try {
      const res = await adminApiFetch<SyncPaymentData>(`/api/admin/orders/${orderId}/sync-payment`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setSyncPaymentMessage(res.message);
      if (res.order) {
        const normalized = normalizeOrderDetail(res.order);
        setOrder(normalized);
        setSelectedStatus(
          statusToSelectValue(orderStatusSelectSource(normalized.paymentStatus, normalized.status))
        );
      }
      onStatusUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao sincronizar pagamento");
    } finally {
      setSyncPaymentLoading(false);
    }
  }, [orderId, onStatusUpdated]);

  const handleSubmitStatus = useCallback(async () => {
    if (!orderId || !selectedStatus) return;
    setUpdating(true);
    setError(null);
    setStatusSuccessMessage(null);
    try {
      const body: { status: string; cancellationReason?: string } = { status: selectedStatus };
      if (selectedStatus === "cancelled" && cancellationReason.trim()) {
        body.cancellationReason = cancellationReason.trim();
      }
      await adminApiFetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const label =
        STATUS_OPTIONS.find((o) => o.value === selectedStatus)?.label ?? selectedStatus;
      setStatusSuccessMessage(`Status alterado para «${label}».`);
      setCancellationReason("");
      setOrder((prev) => {
        if (!prev) return null;
        const fulfillmentOnly =
          selectedStatus === "delivered" || selectedStatus === "shipped";
        return {
          ...prev,
          status: selectedStatus,
          paymentStatus: fulfillmentOnly
            ? (prev.paymentStatus ?? prev.status)
            : selectedStatus,
        };
      });
      onStatusUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar status");
    } finally {
      setUpdating(false);
    }
  }, [orderId, selectedStatus, cancellationReason, onStatusUpdated]);

  return {
    order,
    loading,
    updating,
    error,
    selectedStatus,
    setSelectedStatus,
    statusSuccessMessage,
    setStatusSuccessMessage,
    syncPaymentLoading,
    syncPaymentMessage,
    cancellationReason,
    setCancellationReason,
    handleSyncPayment,
    handleSubmitStatus,
  };
};
