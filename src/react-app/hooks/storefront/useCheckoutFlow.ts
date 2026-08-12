import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useCart } from "@/react-app/contexts/CartContext";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import type { CheckoutStep } from "@/react-app/types/checkout";
import { useCheckoutShipping } from "@/react-app/hooks/storefront/checkout/useCheckoutShipping";
import { useCheckoutCustomer } from "@/react-app/hooks/storefront/checkout/useCheckoutCustomer";
import { useCheckoutPayment } from "@/react-app/hooks/storefront/checkout/useCheckoutPayment";

export function useCheckoutFlow(onCloseDrawer: () => void) {
  const { items, updateQuantity, removeItem, clearCart, total, calculateItemPrice } = useCart();
  const { user } = useAuth();
  const { settings } = useStoreSettings();

  const [step, setStep] = useState<CheckoutStep>("summary");
  const [direction, setDirection] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [stepError, setStepError] = useState<string | null>(null);

  const minimumOrderValue = settings?.minimumOrderValue ?? null;
  const requireLoginToCheckout = settings?.publicProfile?.requireLoginToCheckout !== false;
  const belowMinimum = minimumOrderValue != null && minimumOrderValue > 0 && total < minimumOrderValue;
  const hasInsufficientStock = items.some((item) => item.stock != null && item.quantity > item.stock);

  const itemsFingerprint = useMemo(
    () => items.map((i) => `${i.id}:${i.quantity}`).join("|"),
    [items],
  );

  const shipping = useCheckoutShipping(items, calculateItemPrice, itemsFingerprint);
  const grandTotal = Math.max(
    0,
    Math.round((total + shipping.shippingFee - shipping.couponDiscount) * 100) / 100,
  );

  const clearFieldErrors = useCallback(() => {
    setFieldErrors({});
    setStepError(null);
  }, []);

  const goToStep = useCallback(
    (next: CheckoutStep, dir: number) => {
      setDirection(dir);
      setStep(next);
      clearFieldErrors();
    },
    [clearFieldErrors],
  );

  const customer = useCheckoutCustomer({
    shippingCep: shipping.shippingCep,
    shippingOk: shipping.shippingOk,
    requireLoginToCheckout,
    user,
    clearFieldErrors,
  });

  const payment = useCheckoutPayment({
    items,
    calculateItemPrice,
    clearCart,
    user,
    customerName: customer.customerName,
    customerPhone: customer.customerPhone,
    deliveryAddress: customer.deliveryAddress,
    guestEmail: customer.guestEmail,
    shippingCep: shipping.shippingReady?.cep,
    couponInput: shipping.couponInput,
    goToStep,
    clearFieldErrors,
    setFieldErrors,
    setStepError,
  });

  useEffect(() => {
    if (items.length === 0 && step !== "success") setStep("summary");
  }, [items.length, step]);

  const validateSummaryStep = useCallback((): boolean => {
    clearFieldErrors();
    if (items.length === 0) {
      setStepError("Seu carrinho está vazio.");
      return false;
    }
    if (hasInsufficientStock) {
      setStepError("Estoque insuficiente em um ou mais itens.");
      return false;
    }
    if (belowMinimum) {
      setStepError("O valor mínimo do pedido não foi atingido.");
      return false;
    }
    return true;
  }, [items.length, hasInsufficientStock, belowMinimum, clearFieldErrors]);

  const advanceFromSummary = useCallback(() => {
    if (!validateSummaryStep()) return;
    goToStep("identity", 1);
  }, [validateSummaryStep, goToStep]);

  const advanceFromIdentity = useCallback(async () => {
    if (!customer.validateIdentityStep(setFieldErrors)) return;
    await payment.advanceFromIdentity();
  }, [customer, payment]);

  const goBack = useCallback(() => {
    if (step === "identity") goToStep("summary", -1);
    else if (step === "payment") goToStep("identity", -1);
  }, [step, goToStep]);

  const finishAndClose = useCallback(() => {
    clearCart();
    payment.resetPaymentState();
    setStep("summary");
    onCloseDrawer();
  }, [clearCart, payment, onCloseDrawer]);

  return {
    step,
    direction,
    fieldErrors,
    stepError,
    items,
    updateQuantity,
    removeItem,
    clearCart,
    total,
    grandTotal,
    ...shipping,
    calculateItemPrice,
    user,
    apiError: payment.apiError,
    isSubmitting: payment.isSubmitting,
    showLoginModal: customer.showLoginModal,
    setShowLoginModal: customer.setShowLoginModal,
    customerName: customer.customerName,
    setCustomerName: customer.setCustomerName,
    customerPhone: customer.customerPhone,
    setCustomerPhone: customer.setCustomerPhone,
    deliveryAddress: customer.deliveryAddress,
    setDeliveryAddress: customer.setDeliveryAddress,
    guestEmail: customer.guestEmail,
    setGuestEmail: customer.setGuestEmail,
    minimumOrderValue,
    requireLoginToCheckout,
    belowMinimum,
    hasInsufficientStock,
    paymentMethod: payment.paymentMethod,
    setPaymentMethod: payment.setPaymentMethod,
    orderId: payment.orderId,
    orderTotal: payment.orderTotal,
    pixData: payment.pixData,
    advanceFromSummary,
    advanceFromIdentity,
    goBack,
    submitPayment: payment.submitPayment,
    finishAndClose,
  };
}
