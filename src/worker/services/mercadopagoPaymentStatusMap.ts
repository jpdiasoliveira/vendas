/**
 * Mapeamento central: status de pagamento na API do Mercado Pago → ação do webhook local.
 * Documentação MP: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/payment-status
 */

export type MercadoPagoWebhookPaymentAction =
  | "APPLY_APPROVAL"
  | "CANCEL_LOCAL_ORDER"
  | "NO_ACTION";

const APPROVED = new Set(["approved"]);

const CANCEL_LOCAL = new Set(["rejected", "cancelled", "canceled", "refunded"]);

/**
 * Classifica o status retornado por GET /v1/payments/:id para decidir o fluxo no worker.
 */
export const mapMpPaymentStatusToWebhookAction = (
  mpStatus: string | null | undefined
): MercadoPagoWebhookPaymentAction => {
  const s = String(mpStatus ?? "")
    .trim()
    .toLowerCase();
  if (APPROVED.has(s)) return "APPLY_APPROVAL";
  if (CANCEL_LOCAL.has(s)) return "CANCEL_LOCAL_ORDER";
  return "NO_ACTION";
};

/**
 * Status MP que não alteramos o pedido (aguardamos outro evento ou expiração).
 * Útil para logs e métricas.
 */
export const isMercadoPagoPaymentStatusPendingLike = (mpStatus: string | null | undefined): boolean => {
  const s = String(mpStatus ?? "")
    .trim()
    .toLowerCase();
  return s === "pending" || s === "in_process" || s === "authorized" || s === "in_mediation";
};
