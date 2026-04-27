import type { Order } from "@/react-app/types";

/** URL absoluta da página de confirmação (cliente acompanha status e rastreio). */
export const buildOrderConfirmationShareUrl = (
  order: Pick<Order, "id" | "guestCheckoutEmail">,
  origin = typeof window !== "undefined" ? window.location.origin : ""
): string => {
  const path = `/order/${encodeURIComponent(order.id)}/confirmation`;
  const g = order.guestCheckoutEmail?.trim();
  if (!g) return `${origin}${path}`;
  return `${origin}${path}?guestEmail=${encodeURIComponent(g)}`;
};
