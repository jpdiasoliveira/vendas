import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/react-app/services/api";
import type { CartItem } from "@/react-app/contexts/CartContext";
import { buildCheckoutApiLines } from "@/react-app/utils/checkoutPayload";

type ShippingReady = { cep: string; fee: number };

export function useCheckoutShipping(
  items: CartItem[],
  calculateItemPrice: (product: CartItem, quantity: number) => number,
  itemsFingerprint: string,
) {
  const [shippingCep, setShippingCep] = useState("");
  const [shippingReady, setShippingReady] = useState<ShippingReady | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

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
      const formattedItems = buildCheckoutApiLines(items, calculateItemPrice);
      const data = await apiFetch<{
        valid: boolean;
        discountAmount?: number;
        error?: string;
      }>("/api/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code, items: formattedItems }),
      });
      if (!data.valid) {
        setCouponError(data.error ?? "Cupom inválido.");
        return;
      }
      setCouponDiscount(typeof data.discountAmount === "number" ? data.discountAmount : 0);
    } catch (e: unknown) {
      setCouponError(e instanceof Error ? e.message : "Não foi possível validar o cupom.");
    } finally {
      setCouponLoading(false);
    }
  }, [couponInput, items, calculateItemPrice]);

  const shippingFee = shippingReady?.fee ?? 0;
  const shippingOk = shippingReady != null && !shippingError;

  return {
    shippingCep,
    setShippingCep,
    shippingReady,
    shippingError,
    shippingLoading,
    shippingFee,
    shippingOk,
    handleQuoteShipping,
    couponInput,
    setCouponInput,
    couponDiscount,
    couponError,
    couponLoading,
    handleApplyCoupon,
  };
}
