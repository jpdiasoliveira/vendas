import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useCart } from "@/react-app/contexts/CartContext";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { useCheckout } from "@/react-app/hooks/useCheckout";
import { apiFetch } from "@/react-app/services/api";

export const useCartModalCheckout = (onCloseParent: () => void) => {
  const { items, updateQuantity, removeItem, clearCart, total, calculateItemPrice } = useCart();
  const { user } = useAuth();
  const { settings } = useStoreSettings();
  const { createOrder, isProcessing, error } = useCheckout();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [placedOrderTotal, setPlacedOrderTotal] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const [shippingCep, setShippingCep] = useState("");
  const [shippingReady, setShippingReady] = useState<{ cep: string; fee: number } | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const minimumOrderValue = settings?.minimumOrderValue ?? null;
  const requireLoginToCheckout = settings?.publicProfile?.requireLoginToCheckout !== false;
  const belowMinimum =
    minimumOrderValue != null && minimumOrderValue > 0 && total < minimumOrderValue;
  const hasInsufficientStock = items.some((item) => item.stock != null && item.quantity > item.stock);
  const hasRequiredFields = customerPhone.trim() !== "" && deliveryAddress.trim() !== "";
  const guestEmailOk = useMemo(() => {
    const t = guestEmail.trim();
    return t.length > 4 && t.includes("@") && !t.includes(" ");
  }, [guestEmail]);

  const shippingFee = shippingReady?.fee ?? 0;
  const grandTotal = Math.max(0, Math.round((total + shippingFee - couponDiscount) * 100) / 100);
  const shippingOk = shippingReady != null && !shippingError;

  const itemsFingerprint = useMemo(
    () => items.map((i) => `${i.id}:${i.quantity}`).join("|"),
    [items]
  );

  useEffect(() => {
    setShippingReady(null);
    setShippingError(null);
    setCouponDiscount(0);
    setCouponError(null);
  }, [itemsFingerprint]);

  const handleQuoteShipping = useCallback(async () => {
    setShippingLoading(true);
    setShippingError(null);
    setShippingReady(null);
    try {
      const data = await apiFetch<{
        deliverable: boolean;
        cep?: string;
        fee?: number;
        message?: string;
      }>("/api/shipping/quote", {
        method: "POST",
        body: JSON.stringify({ cep: shippingCep }),
      });
      if (!data.deliverable) {
        setShippingError(data.message ?? "Não entregamos neste CEP.");
        return;
      }
      if (data.cep != null && typeof data.fee === "number") {
        setShippingReady({ cep: data.cep, fee: data.fee });
      }
    } catch (e: unknown) {
      setShippingError(e instanceof Error ? e.message : "Não foi possível calcular o frete.");
    } finally {
      setShippingLoading(false);
    }
  }, [shippingCep]);

  const handleApplyCoupon = useCallback(async () => {
    setCouponLoading(true);
    setCouponError(null);
    setCouponDiscount(0);
    const code = couponInput.trim();
    if (!code) {
      setCouponLoading(false);
      return;
    }
    try {
      const formattedItems = items.map((item) => {
        const unitPrice = calculateItemPrice(item, item.quantity);
        const img = item.image ?? item.imageUrl;
        return {
          id: item.id,
          name: item.name,
          price: unitPrice,
          quantity: item.quantity,
          ...(img ? { image: img, imageUrl: img } : {}),
        };
      });
      const data = await apiFetch<{
        valid: boolean;
        subtotal?: number;
        discountAmount?: number;
        code?: string | null;
        error?: string;
      }>("/api/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code, items: formattedItems }),
      });
      if (!data.valid) {
        setCouponError(data.error ?? "Cupom inválido.");
        return;
      }
      const disc = typeof data.discountAmount === "number" ? data.discountAmount : 0;
      setCouponDiscount(disc);
    } catch (e: unknown) {
      setCouponError(e instanceof Error ? e.message : "Não foi possível validar o cupom.");
    } finally {
      setCouponLoading(false);
    }
  }, [couponInput, items, calculateItemPrice]);

  const canFinalize = useMemo(
    () =>
      !hasInsufficientStock &&
      hasRequiredFields &&
      shippingOk &&
      !belowMinimum &&
      (requireLoginToCheckout ? !!user : !!user || guestEmailOk),
    [
      hasInsufficientStock,
      hasRequiredFields,
      shippingOk,
      belowMinimum,
      requireLoginToCheckout,
      user,
      guestEmailOk,
    ]
  );

  const handleCheckout = useCallback(async () => {
    if (requireLoginToCheckout && !user) {
      setShowLoginModal(true);
      return;
    }
    if (!requireLoginToCheckout && !user && !guestEmailOk) return;
    if (!customerPhone.trim() || !deliveryAddress.trim()) return;
    if (hasInsufficientStock || belowMinimum) return;
    if (!shippingReady) return;

    try {
      const formattedItems = items.map((item) => {
        const unitPrice = calculateItemPrice(item, item.quantity);
        const img = item.image ?? item.imageUrl;
        return {
          id: item.id,
          name: item.name,
          price: unitPrice,
          quantity: item.quantity,
          ...(img ? { image: img, imageUrl: img } : {}),
        };
      });

      const data = await createOrder(formattedItems, {
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        deliveryAddress: deliveryAddress.trim() || undefined,
        guestEmail: !user && guestEmailOk ? guestEmail.trim() : undefined,
        shippingPostalCode: shippingReady.cep,
        couponCode: couponInput.trim() || undefined,
      });
      setCurrentOrderId(data.orderId);
      setPlacedOrderTotal(data.total);
      setShowCheckoutModal(true);
    } catch (err) {
      console.error("[useCartModalCheckout.handleCheckout]", err);
    }
  }, [
    requireLoginToCheckout,
    user,
    guestEmailOk,
    customerPhone,
    deliveryAddress,
    hasInsufficientStock,
    belowMinimum,
    items,
    calculateItemPrice,
    createOrder,
    customerName,
    guestEmail,
    shippingReady,
    couponInput,
  ]);

  const closeCheckoutSuccess = useCallback(() => {
    setShowCheckoutModal(false);
    setPlacedOrderTotal(null);
    clearCart();
    onCloseParent();
  }, [clearCart, onCloseParent]);

  return {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    total,
    grandTotal,
    shippingFee,
    shippingCep,
    setShippingCep,
    shippingReady,
    shippingError,
    shippingLoading,
    handleQuoteShipping,
    couponInput,
    setCouponInput,
    couponDiscount,
    couponError,
    couponLoading,
    handleApplyCoupon,
    calculateItemPrice,
    user,
    error,
    isProcessing,
    showLoginModal,
    setShowLoginModal,
    showCheckoutModal,
    currentOrderId,
    placedOrderTotal,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    deliveryAddress,
    setDeliveryAddress,
    guestEmail,
    setGuestEmail,
    minimumOrderValue,
    requireLoginToCheckout,
    belowMinimum,
    hasInsufficientStock,
    hasRequiredFields,
    guestEmailOk,
    canFinalize,
    handleCheckout,
    closeCheckoutSuccess,
  };
};
