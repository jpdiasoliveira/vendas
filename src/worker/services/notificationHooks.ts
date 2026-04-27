/**
 * Hooks de notificação: audit_logs + fila de e-mail transacional (`services/email`).
 */

import { logAuditEvent } from "../utils/audit.js";
import {
  queueOrderCreatedEmail,
  queueOrderPaidEmail,
  queueOrderShippedEmail,
} from "./email/transactionalEmailService.js";

export const notifyOrderCreated = async (
  env: Env,
  params: {
    storeId: string;
    orderId: string;
    userId: string | null;
    total?: number;
    shippingCep?: string | null;
    /** E-mail do cliente (logado ou checkout visitante), quando conhecido. */
    recipientEmail?: string | null;
  }
): Promise<void> => {
  await logAuditEvent(env, {
    storeId: params.storeId,
    userId: params.userId,
    action: "ORDER_EMAIL_HOOK_CREATED",
    resourceType: "order",
    resourceId: params.orderId,
    details: {
      channel: "email_pending",
      template: "order_created",
      total: params.total ?? null,
      shipping_cep: params.shippingCep ?? null,
      recipient: params.recipientEmail?.trim() || null,
    },
  });
  await queueOrderCreatedEmail(env, {
    storeId: params.storeId,
    orderId: params.orderId,
    to: params.recipientEmail?.trim() || null,
    total: params.total,
    shippingCep: params.shippingCep,
  });
};

export const notifyOrderPaid = async (
  env: Env,
  params: {
    storeId: string;
    orderId: string;
    userId: string | null;
    mpPaymentId?: number | null;
    recipientEmail?: string | null;
  }
): Promise<void> => {
  await logAuditEvent(env, {
    storeId: params.storeId,
    userId: params.userId,
    action: "ORDER_EMAIL_HOOK_PAID",
    resourceType: "order",
    resourceId: params.orderId,
    details: {
      channel: "email_pending",
      template: "order_paid",
      mp_payment_id: params.mpPaymentId ?? null,
      recipient: params.recipientEmail?.trim() || null,
    },
  });
  await queueOrderPaidEmail(env, {
    storeId: params.storeId,
    orderId: params.orderId,
    to: params.recipientEmail?.trim() || null,
    mpPaymentId: params.mpPaymentId,
  });
};

export const notifyOrderShipped = async (
  env: Env,
  params: {
    storeId: string;
    orderId: string;
    userId: string | null;
    recipientEmail?: string | null;
  }
): Promise<void> => {
  await logAuditEvent(env, {
    storeId: params.storeId,
    userId: params.userId,
    action: "ORDER_EMAIL_HOOK_SHIPPED",
    resourceType: "order",
    resourceId: params.orderId,
    details: {
      channel: "email_pending",
      template: "order_shipped",
      recipient: params.recipientEmail?.trim() || null,
    },
  });
  await queueOrderShippedEmail(env, {
    storeId: params.storeId,
    orderId: params.orderId,
    to: params.recipientEmail?.trim() || null,
  });
};
