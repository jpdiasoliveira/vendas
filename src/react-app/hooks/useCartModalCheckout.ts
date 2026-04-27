import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useCart } from "@/react-app/contexts/CartContext";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { useCheckout } from "@/react-app/hooks/useCheckout";

export const useCartModalCheckout = (onCloseParent: () => void) => {
  const { items, updateQuantity, removeItem, clearCart, total, calculateItemPrice } = useCart();
  const { user } = useAuth();
  const { settings } = useStoreSettings();
  const { createOrder, isProcessing, error } = useCheckout();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

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

  const canFinalize = useMemo(
    () =>
      !hasInsufficientStock &&
      hasRequiredFields &&
      !belowMinimum &&
      (requireLoginToCheckout ? !!user : !!user || guestEmailOk),
    [hasInsufficientStock, hasRequiredFields, belowMinimum, requireLoginToCheckout, user, guestEmailOk]
  );

  const handleCheckout = useCallback(async () => {
    if (requireLoginToCheckout && !user) {
      setShowLoginModal(true);
      return;
    }
    if (!requireLoginToCheckout && !user && !guestEmailOk) return;
    if (!customerPhone.trim() || !deliveryAddress.trim()) return;
    if (hasInsufficientStock || belowMinimum) return;

    try {
      const formattedItems = items.map((item) => {
        const unitPrice = calculateItemPrice(item, item.quantity);
        return {
          id: item.id,
          name: item.name,
          price: unitPrice,
          quantity: item.quantity,
          image: item.image,
        };
      });

      const data = await createOrder(formattedItems, {
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        deliveryAddress: deliveryAddress.trim() || undefined,
        guestEmail: !user && guestEmailOk ? guestEmail.trim() : undefined,
      });
      setCurrentOrderId(data.orderId);
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
  ]);

  const closeCheckoutSuccess = useCallback(() => {
    setShowCheckoutModal(false);
    clearCart();
    onCloseParent();
  }, [clearCart, onCloseParent]);

  return {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    total,
    calculateItemPrice,
    user,
    error,
    isProcessing,
    showLoginModal,
    setShowLoginModal,
    showCheckoutModal,
    currentOrderId,
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
