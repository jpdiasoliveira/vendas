import type { OrderDetail } from "@/react-app/types";

export const STATUS_OPTIONS = [
  { value: "pending", label: "Pendente" },
  { value: "paid", label: "Pago" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregue" },
  { value: "cancelled", label: "Cancelado" },
] as const;

export const orderStatusSelectSource = (
  paymentStatus: string | null | undefined,
  status: string | null | undefined,
): string => {
  const st = (status ?? "").trim().toLowerCase();
  if (st === "delivered" || st === "shipped") return (status ?? "").trim();
  return (paymentStatus ?? status ?? "").trim();
};

export const statusToSelectValue = (apiStatus: string | null | undefined): string => {
  const s = (apiStatus ?? "").trim().toLowerCase();
  if (s === "approved") return "paid";
  if (s === "canceled") return "cancelled";
  if (["pending", "paid", "shipped", "delivered", "cancelled"].includes(s)) return s;
  return "pending";
};

export const getOrderCancellationDisplay = (
  metadata: Record<string, unknown> | null | undefined,
): { reasonLabel: string | null; autoExpiredAt: string | null } => {
  const raw = metadata?.cancelled_reason;
  const code = typeof raw === "string" ? raw.trim() : "";
  let reasonLabel: string | null = null;
  if (code === "expired_pending_timeout") {
    reasonLabel =
      "Cancelado automaticamente: o prazo para pagamento expirou. O estoque reservado voltou ao catálogo.";
  } else if (code) {
    reasonLabel = `Motivo registado no sistema: ${code}`;
  }
  const ate = metadata?.auto_expired_at;
  const autoExpiredAt = typeof ate === "string" && ate.trim() ? ate.trim() : null;
  return { reasonLabel, autoExpiredAt };
};

export const orderNeedsCancellationMotive = (o: OrderDetail): boolean => {
  if (o.paidAt && String(o.paidAt).trim() !== "") return true;
  const s = (o.paymentStatus ?? o.status ?? "").trim().toLowerCase();
  return s === "paid" || s === "approved" || s === "shipped" || s === "delivered";
};

export const buildWhatsAppUrl = (raw: string | null | undefined): string | null => {
  const t = raw?.trim();
  if (!t) return null;
  const digits = t.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const intl = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${intl}`;
};

export const normalizeOrderDetail = (data: OrderDetail): OrderDetail => ({
  ...data,
  items: Array.isArray(data.items) ? data.items : [],
});
