const PAID_STATUSES = ["paid", "approved"];

export const isPaidStatus = (s: string | null | undefined): boolean =>
  !!s && PAID_STATUSES.includes(s.toLowerCase());

export const inventoryCommittedStatus = (s: string | null | undefined): boolean => {
  if (!s) return false;
  const t = s.toLowerCase();
  return t === "paid" || t === "approved" || t === "shipped" || t === "delivered";
};

/** ID de pagamento MP normalizado para comparação segura (webhook idempotente). */
export const normalizeMpPaymentIdRef = (id: number | string | null | undefined): string | null => {
  if (id == null) return null;
  const s = String(id).trim();
  return s === "" ? null : s;
};
