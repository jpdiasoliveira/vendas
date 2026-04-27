/**
 * Reconcilia o snapshot de um pagamento MP com o pedido local.
 * Usado pelo webhook e pela rota admin de sincronização manual — mesma tranca/idempotência (Etapa 2).
 */

import type { GetPaymentResult } from "./mercadopago.js";
import {
  isMercadoPagoPaymentStatusPendingLike,
  mapMpPaymentStatusToWebhookAction,
} from "./mercadopagoPaymentStatusMap.js";
import { getOrderById, updateOrderPaymentStatus, updateOrderStatus } from "../core/database.js";
import type { UpdateOrderPaymentStatusOutcome } from "../core/db/orders/orderPayment.js";
import { redactSecrets } from "../utils/safeApiError.js";
import { notifyOrderPaid } from "./notificationHooks.js";

export type ApplyMercadoPagoPaymentSnapshotResult =
  | {
      kind: "approval";
      outcome: UpdateOrderPaymentStatusOutcome;
      userMessage: string;
    }
  | { kind: "cancelled"; userMessage: string }
  | { kind: "ignored"; reason: "reference_mismatch" | "pending_like" | "other"; mpStatus: string; userMessage: string };

function userMessageForApproval(outcome: UpdateOrderPaymentStatusOutcome): string {
  switch (outcome) {
    case "paid":
      return "Pagamento confirmado no Mercado Pago. O pedido foi atualizado.";
    case "idempotent_skip":
      return "O pedido já estava alinhado com este pagamento (nada a alterar).";
    case "payment_id_conflict":
      return "Este pedido já está vinculado a outro pagamento no Mercado Pago. Revise manualmente no MP e no pedido.";
    case "stock_conflict_cancelled":
      return "O MP aprovou o pagamento, mas não havia estoque suficiente: o pedido foi cancelado no sistema. Efetue estorno no Mercado Pago se necessário.";
    case "skipped_not_found":
      return "Pedido não encontrado ao aplicar o pagamento.";
    case "updated_non_paid":
      return "O Mercado Pago está aprovado, mas o pedido não pôde ser marcado como pago neste estado (ex.: cancelado).";
    default:
      return "Sincronização concluída com resposta inesperada; verifique o pedido.";
  }
}

/**
 * Aplica o resultado de GET /v1/payments/:id ao pedido cujo id deve coincidir com `external_reference`.
 * Webhook e admin chamam isto depois de obter o pagamento na API do MP.
 */
export const applyMercadoPagoPaymentSnapshotToOrder = async (
  env: Env,
  params: { orderId: string; payment: GetPaymentResult }
): Promise<ApplyMercadoPagoPaymentSnapshotResult> => {
  const oid = String(params.orderId).trim();
  const ref = String(params.payment.external_reference ?? "").trim();
  if (!ref || ref !== oid) {
    return {
      kind: "ignored",
      reason: "reference_mismatch",
      mpStatus: params.payment.status,
      userMessage:
        "O pagamento consultado não pertence a este pedido (external_reference diferente). Nada foi alterado.",
    };
  }

  const action = mapMpPaymentStatusToWebhookAction(params.payment.status);

  if (action === "APPLY_APPROVAL") {
    const outcome = await updateOrderPaymentStatus(env, oid, "approved", {
      paymentId: params.payment.id,
    });
    if (outcome === "paid") {
      const paidOrder = await getOrderById(env, oid);
      if (paidOrder) {
        await notifyOrderPaid(env, {
          storeId: paidOrder.storeId,
          orderId: oid,
          userId: paidOrder.userId,
          mpPaymentId: params.payment.id,
          recipientEmail: paidOrder.guestCheckoutEmail?.trim() || null,
        });
      }
    }
    return { kind: "approval", outcome, userMessage: userMessageForApproval(outcome) };
  }

  if (action === "CANCEL_LOCAL_ORDER") {
    const order = await getOrderById(env, oid);
    if (order) {
      await updateOrderStatus(env, oid, order.storeId, "cancelled");
    }
    return {
      kind: "cancelled",
      userMessage: `Pagamento no Mercado Pago: «${params.payment.status}». O pedido foi marcado como cancelado.`,
    };
  }

  if (isMercadoPagoPaymentStatusPendingLike(params.payment.status)) {
    return {
      kind: "ignored",
      reason: "pending_like",
      mpStatus: params.payment.status,
      userMessage: `No Mercado Pago o pagamento ainda está «${params.payment.status}» (aguardando confirmação). Nada foi alterado no pedido.`,
    };
  }

  return {
    kind: "ignored",
    reason: "other",
    mpStatus: params.payment.status,
    userMessage: `Status no Mercado Pago: «${params.payment.status}». Nenhuma ação automática foi aplicada.`,
  };
};

/**
 * Mensagem amigável para falha ao chamar a API do Mercado Pago (rede, 404, credencial).
 */
export const formatMercadoPagoFetchError = (err: unknown): string => {
  const raw = redactSecrets(err instanceof Error ? err.message : String(err));
  const lower = raw.toLowerCase();
  if (lower.includes("(404)") || lower.includes(" not found") || raw.includes("404")) {
    return "Não encontramos este pagamento no Mercado Pago. O ID pode estar incorreto ou o pagamento foi removido.";
  }
  if (lower.includes("(401)") || lower.includes("(403)")) {
    return "O servidor não conseguiu autenticar no Mercado Pago (token inválido ou sem permissão).";
  }
  return raw.startsWith("Mercado Pago")
    ? `Falha ao consultar o Mercado Pago. ${raw}`
    : `Falha ao consultar o Mercado Pago: ${raw}`;
};
