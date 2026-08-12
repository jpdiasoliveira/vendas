import { useCallback, useRef, useState } from "react";
import type { UserContext } from "@/react-app/services/auth.service";
import { useCheckout } from "@/react-app/hooks/useCheckout";
import type { CartItem } from "@/react-app/contexts/CartContext";
import { buildCheckoutApiLines } from "@/react-app/utils/checkoutPayload";

type UseCheckoutOrderCreationParams = {
  items: CartItem[];
  calculateItemPrice: (product: CartItem, quantity: number) => number;
  user: UserContext | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  guestEmail: string;
  shippingCep?: string;
  couponInput: string;
};

export function useCheckoutOrderCreation(params: UseCheckoutOrderCreationParams) {
  const { createOrder } = useCheckout();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  const ensureOrderCreated = useCallback(async (): Promise<string> => {
    if (orderId) return orderId;
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = crypto.randomUUID();
    const formattedItems = buildCheckoutApiLines(params.items, params.calculateItemPrice);
    const data = await createOrder(formattedItems, {
      customerName: params.customerName.trim() || undefined,
      customerPhone: params.customerPhone.trim() || undefined,
      deliveryAddress: params.deliveryAddress.trim() || undefined,
      guestEmail: !params.user && params.guestEmail.trim() ? params.guestEmail.trim() : undefined,
      shippingPostalCode: params.shippingCep,
      couponCode: params.couponInput.trim() || undefined,
      idempotencyKey: idempotencyKeyRef.current,
    });
    setOrderId(data.orderId);
    setOrderTotal(data.total);
    return data.orderId;
  }, [orderId, params, createOrder]);

  const resetOrderState = useCallback(() => {
    setOrderId(null);
    setOrderTotal(null);
    idempotencyKeyRef.current = null;
  }, []);

  return { orderId, orderTotal, ensureOrderCreated, resetOrderState };
}
