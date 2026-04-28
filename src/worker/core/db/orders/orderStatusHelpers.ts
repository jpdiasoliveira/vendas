const PAID_STATUSES = ["paid", "approved"];

/** Pedido criado com RPC que já reservou estoque em `products` (metadata no banco). */
export const orderHasStockReservedAtCreate = (
  metadata: Record<string, unknown> | null | undefined
): boolean => {
  const v = metadata?.stock_reserved_at_create;
  return v === true || v === "true";
};

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
