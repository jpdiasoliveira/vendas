import { useEffect, useRef } from "react";
import { apiFetch } from "@/react-app/services/api";
import type { CheckoutPixData } from "@/react-app/types/checkout";

const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 24;

export function useCheckoutPixPolling(
  orderId: string,
  guestEmail: string,
  pixData: CheckoutPixData | null,
  paymentApproved: boolean,
  onApproved: () => void,
) {
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!pixData || paymentApproved) return;
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      if (attempts > POLL_MAX_ATTEMPTS) {
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }
      try {
        const qs = guestEmail.trim() ? `?guestEmail=${encodeURIComponent(guestEmail.trim())}` : "";
        const order = await apiFetch<{ paymentStatus?: string }>(`/api/orders/${orderId}${qs}`);
        if (order.paymentStatus === "approved") {
          onApproved();
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        /* polling silencioso */
      }
    };
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    void poll();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId, guestEmail, pixData, paymentApproved, onApproved]);
}
