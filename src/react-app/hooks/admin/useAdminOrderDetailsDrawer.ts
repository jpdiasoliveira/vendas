import { useCallback, useEffect, useState } from "react";
import type { OrderDetail } from "@/react-app/types";
import { useAdminOrderMutations } from "@/react-app/hooks/admin/useAdminOrderMutations";
import {
  STATUS_OPTIONS,
  orderNeedsCancellationMotive,
  orderStatusSelectSource,
  statusToSelectValue,
} from "@/react-app/utils/admin/orderDetails";

type UseAdminOrderDetailsDrawerArgs = {
  isOpen: boolean;
  orderId: string | null;
  order: OrderDetail | null;
  loading: boolean;
};

export function useAdminOrderDetailsDrawer({ isOpen, orderId, order, loading }: UseAdminOrderDetailsDrawerArgs) {
  const { updateStatusMutation, syncPaymentMutation } = useAdminOrderMutations();
  const [selectedStatus, setSelectedStatus] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [statusSuccessMessage, setStatusSuccessMessage] = useState<string | null>(null);
  const [syncPaymentMessage, setSyncPaymentMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedStatus("");
      setCancellationReason("");
      setStatusSuccessMessage(null);
      setSyncPaymentMessage(null);
      setFormError(null);
      return;
    }
    if (order && !loading) {
      setSelectedStatus(
        statusToSelectValue(orderStatusSelectSource(order.paymentStatus, order.status)),
      );
      setCancellationReason("");
      setStatusSuccessMessage(null);
      setSyncPaymentMessage(null);
      setFormError(null);
    }
  }, [isOpen, order, loading, orderId]);

  const handleSyncPayment = useCallback(async () => {
    if (!orderId) return;
    setFormError(null);
    setSyncPaymentMessage(null);
    setStatusSuccessMessage(null);
    try {
      const res = await syncPaymentMutation.mutateAsync(orderId);
      setSyncPaymentMessage(res.message);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erro ao sincronizar pagamento");
    }
  }, [orderId, syncPaymentMutation]);

  const handleSubmitStatus = useCallback(async () => {
    if (!orderId || !selectedStatus || !order) return;
    if (
      selectedStatus === "cancelled" &&
      orderNeedsCancellationMotive(order) &&
      !cancellationReason.trim()
    ) {
      setFormError(
        "Informe o motivo do cancelamento para pedidos já pagos ou em etapa avançada.",
      );
      return;
    }
    setFormError(null);
    setStatusSuccessMessage(null);
    try {
      const payload = {
        status: selectedStatus,
        ...(selectedStatus === "cancelled" && cancellationReason.trim()
          ? { cancellationReason: cancellationReason.trim() }
          : {}),
      };
      await updateStatusMutation.mutateAsync({ orderId, payload });
      const label = STATUS_OPTIONS.find((o) => o.value === selectedStatus)?.label ?? selectedStatus;
      setStatusSuccessMessage(`Status alterado para «${label}».`);
      setCancellationReason("");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erro ao atualizar status");
    }
  }, [orderId, selectedStatus, cancellationReason, order, updateStatusMutation]);

  return {
    selectedStatus,
    setSelectedStatus,
    cancellationReason,
    setCancellationReason,
    statusSuccessMessage,
    setStatusSuccessMessage,
    syncPaymentMessage,
    formError,
    updating: updateStatusMutation.isPending,
    syncPaymentLoading: syncPaymentMutation.isPending,
    handleSyncPayment,
    handleSubmitStatus,
  };
}
