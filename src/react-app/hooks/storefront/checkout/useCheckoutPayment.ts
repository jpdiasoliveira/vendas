import { useCallback, useRef, useState } from "react";
import type { UserContext } from "@/react-app/services/auth.service";
import { useCheckout } from "@/react-app/hooks/useCheckout";
import type { CartItem } from "@/react-app/contexts/CartContext";
import type { CheckoutPixData, CheckoutStep, PaymentMethod } from "@/react-app/types/checkout";
import { checkoutPaymentSchema } from "@/react-app/schemas/checkoutFlow";
import { useCheckoutOrderCreation } from "@/react-app/hooks/storefront/checkout/useCheckoutOrderCreation";
import {
  extractPixFromPaymentResponse,
  flattenZodErrors,
} from "@/react-app/hooks/storefront/checkout/checkoutFlowUtils";

type UseCheckoutPaymentParams = {
  items: CartItem[];
  calculateItemPrice: (product: CartItem, quantity: number) => number;
  clearCart: () => void;
  user: UserContext | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  guestEmail: string;
  shippingCep?: string;
  couponInput: string;
  goToStep: (next: CheckoutStep, dir: number) => void;
  clearFieldErrors: () => void;
  setFieldErrors: (errors: Record<string, string>) => void;
  setStepError: (message: string | null) => void;
};

export function useCheckoutPayment(params: UseCheckoutPaymentParams) {
  const { processPayment, isProcessing, error: apiError } = useCheckout();
  const order = useCheckoutOrderCreation(params);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [pixData, setPixData] = useState<CheckoutPixData | null>(null);
  const [isSubmittingState, setIsSubmittingState] = useState(false);
  const submitLockRef = useRef(false);

  const runLocked = useCallback(async (task: () => Promise<void>) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmittingState(true);
    try {
      await task();
    } finally {
      submitLockRef.current = false;
      setIsSubmittingState(false);
    }
  }, []);

  const advanceFromIdentity = useCallback(async () => {
    await runLocked(async () => {
      await order.ensureOrderCreated();
      params.goToStep("payment", 1);
    });
  }, [runLocked, order, params]);

  const submitPayment = useCallback(async () => {
    params.clearFieldErrors();
    const parsed = checkoutPaymentSchema.safeParse({ paymentMethod: paymentMethod ?? undefined });
    if (!parsed.success) {
      params.setFieldErrors(flattenZodErrors(parsed.error));
      return;
    }
    await runLocked(async () => {
      const oid = await order.ensureOrderCreated();
      const guest = !params.user && params.guestEmail.trim() ? params.guestEmail.trim() : null;
      const data = await processPayment(oid, parsed.data.paymentMethod, guest);
      if (parsed.data.paymentMethod === "credit_card" && data.init_point) {
        window.location.href = data.init_point;
        return;
      }
      const pix = extractPixFromPaymentResponse(data);
      if (parsed.data.paymentMethod === "pix" && (pix.qrCodeBase64 || pix.copyPaste)) {
        setPixData(pix);
        params.clearCart();
        params.goToStep("success", 1);
        return;
      }
      params.setStepError("Não foi possível iniciar o pagamento. Tente novamente ou escolha outra forma.");
    });
  }, [paymentMethod, params, runLocked, order, processPayment]);

  const resetPaymentState = useCallback(() => {
    order.resetOrderState();
    setPixData(null);
    setPaymentMethod(null);
  }, [order]);

  return {
    paymentMethod,
    setPaymentMethod,
    orderId: order.orderId,
    orderTotal: order.orderTotal,
    pixData,
    apiError,
    isSubmitting: isProcessing || isSubmittingState,
    advanceFromIdentity,
    submitPayment,
    resetPaymentState,
  };
}
