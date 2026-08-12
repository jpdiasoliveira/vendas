import { useCallback, useEffect, useState } from "react";
import { useAdminOrderMutations } from "@/react-app/hooks/admin/useAdminOrderMutations";

type UseAdminTrackingDrawerArgs = {
  isOpen: boolean;
  orderId: string | null;
  initialTrackingCode?: string | null;
  initialShippingMethod?: string | null;
  onSaved: () => void;
  onClose: () => void;
};

export function useAdminTrackingDrawer({
  isOpen,
  orderId,
  initialTrackingCode,
  initialShippingMethod,
  onSaved,
  onClose,
}: UseAdminTrackingDrawerArgs) {
  const { updateTrackingMutation } = useAdminOrderMutations();
  const [trackingCode, setTrackingCode] = useState("");
  const [shippingMethod, setShippingMethod] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTrackingCode(initialTrackingCode ?? "");
    setShippingMethod(initialShippingMethod ?? "");
    setError(null);
  }, [isOpen, orderId, initialTrackingCode, initialShippingMethod]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!orderId) return;
      setError(null);
      try {
        await updateTrackingMutation.mutateAsync({
          orderId,
          payload: {
            trackingCode: trackingCode.trim() || null,
            shippingMethod: shippingMethod.trim() || null,
          },
        });
        onSaved();
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao salvar rastreio");
      }
    },
    [orderId, trackingCode, shippingMethod, updateTrackingMutation, onSaved, onClose],
  );

  return {
    trackingCode,
    setTrackingCode,
    shippingMethod,
    setShippingMethod,
    saving: updateTrackingMutation.isPending,
    error,
    handleSubmit,
  };
}
