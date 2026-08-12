import { apiFetch } from "@/react-app/services/api";
import type { OrderWithItems } from "@/react-app/types";

export async function fetchGuestOrder(orderId: string, guestEmail: string): Promise<OrderWithItems> {
  const oid = orderId.trim();
  const email = guestEmail.trim();
  const qs = `?guestEmail=${encodeURIComponent(email)}`;
  return apiFetch<OrderWithItems>(`/api/orders/${encodeURIComponent(oid)}${qs}`);
}
