import {
  appendOrderNoteLine,
  getAllOrdersByStore,
  getOrderByIdForStore,
  getOrderWithItems,
  mergeOrderMetadata,
  normalizeOrderStatus,
  orderRequiresManualRefundWorkflow,
  updateOrderStatus,
  updateOrderTracking,
} from "../../core/database.js";
import { getPayment } from "../../services/mercadopago.js";
import {
  applyMercadoPagoPaymentSnapshotToOrder,
  formatMercadoPagoFetchError,
} from "../../services/mercadopagoOrderPaymentReconcile.js";
import type { AuthUser } from "../../middlewares/verifyAuth.js";
import { logAction, logAuditEvent } from "../../utils/audit.js";
import { genericServerErrorMessage, logServerError } from "../../utils/safeApiError.js";
import { requireStoreContext } from "../../utils/requireStoreContext.js";
import type { AdminHono } from "./types.js";

export const registerAdminOrderRoutes = (admin: AdminHono): void => {
  admin.get("/orders", async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    try {
      const data = await getAllOrdersByStore(c.env, store.id);
      return c.json({ success: true, data }, 200);
    } catch (err: unknown) {
      logServerError("admin.get /orders", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });

  admin.get("/orders/:id", async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    const orderId = c.req.param("id");
    try {
      const data = await getOrderWithItems(c.env, orderId, store.id);
      if (!data) return c.json({ success: false, error: "Pedido não encontrado" }, 404);
      const payload = { ...data, items: Array.isArray(data.items) ? data.items : [] };
      return c.json({ success: true, data: payload }, 200);
    } catch (err: unknown) {
      logServerError("admin.get /orders/:id", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });

  admin.patch("/orders/:id/status", async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    const orderId = String(c.req.param("id"));
    const body = (await c.req.json()) as { status?: string; cancellationReason?: string | null };
    const newStatus = normalizeOrderStatus(body.status);
    const cancellationReason =
      typeof body.cancellationReason === "string" ? body.cancellationReason.trim() : "";
    if (!newStatus) {
      return c.json(
        {
          success: false,
          error: "Status inválido. Use: pending, paid, approved, shipped, delivered ou cancelled.",
        },
        400
      );
    }
    try {
      const existing = await getOrderByIdForStore(c.env, orderId, store.id);
      if (!existing) {
        return c.json({ success: false, error: "Pedido não encontrado" }, 404);
      }

      const isCancel = newStatus === "cancelled";
      const needsRefundWorkflow = isCancel && orderRequiresManualRefundWorkflow(existing);
      if (needsRefundWorkflow && !cancellationReason) {
        return c.json(
          {
            success: false,
            error:
              "Este pedido já teve pagamento ou avanço financeiro. Informe o motivo do cancelamento e providencie estorno manual no gateway, se necessário.",
          },
          400
        );
      }

      if (isCancel && cancellationReason) {
        if (needsRefundWorkflow) {
          await mergeOrderMetadata(c.env, orderId, store.id, {
            manual_refund_required_at_cancel: true,
            cancellation_reason: cancellationReason,
          });
          await appendOrderNoteLine(
            c.env,
            orderId,
            store.id,
            `[Cancelamento admin] Motivo: ${cancellationReason}. Alerta: estorno manual no gateway pode ser necessário.`
          );
          const user = c.get("user") as AuthUser | undefined;
          if (user?.id) {
            await logAuditEvent(c.env, {
              storeId: store.id,
              userId: user.id,
              action: "ORDER_MANUAL_REFUND_ALERT",
              resourceType: "order",
              resourceId: orderId,
              details: {
                reason: cancellationReason,
                previous_status: existing.status,
              },
            });
          }
        } else {
          await appendOrderNoteLine(
            c.env,
            orderId,
            store.id,
            `[Cancelamento admin] Motivo: ${cancellationReason}`
          );
        }
      }

      await updateOrderStatus(c.env, orderId, store.id, newStatus);
      await logAction(c, "UPDATE_ORDER_STATUS", "order", orderId, {
        status: newStatus,
        ...(cancellationReason ? { cancellation_reason: cancellationReason } : {}),
        ...(needsRefundWorkflow ? { manual_refund_required: true } : {}),
      });
      return c.json({ success: true, data: { status: newStatus } }, 200);
    } catch (err: unknown) {
      logServerError(`admin.patch /orders/:id/status order=${orderId} newStatus=${newStatus}`, err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });

  admin.patch("/orders/:id/tracking", async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    const orderId = c.req.param("id");
    const body = (await c.req.json()) as { trackingCode?: string | null; shippingMethod?: string | null };
    try {
      await updateOrderTracking(c.env, orderId, store.id, {
        trackingCode: body.trackingCode,
        shippingMethod: body.shippingMethod,
      });
      await logAction(c, "UPDATE_ORDER_TRACKING", "order", orderId, {
        trackingCode: body.trackingCode ?? null,
        shippingMethod: body.shippingMethod ?? null,
      });
      return c.json({ success: true, data: { ok: true } }, 200);
    } catch (err: unknown) {
      logServerError("admin.patch /orders/:id/tracking", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });

  /**
   * Sincronização proativa: consulta o Mercado Pago pelo payment_id do pedido e aplica o mesmo fluxo do webhook (tranca + idempotência).
   */
  admin.post("/orders/:id/sync-payment", async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    const orderId = String(c.req.param("id")).trim();
    const token = c.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) {
      return c.json(
        {
          success: false,
          error: "Pagamentos não configurados: falta MERCADO_PAGO_ACCESS_TOKEN no servidor.",
        },
        500
      );
    }

    try {
      const row = await getOrderWithItems(c.env, orderId, store.id);
      if (!row) {
        return c.json({ success: false, error: "Pedido não encontrado nesta loja." }, 404);
      }

      const rawPid = row.paymentId != null ? String(row.paymentId).trim() : "";
      if (!rawPid) {
        return c.json(
          {
            success: false,
            error:
              "Este pedido ainda não tem um ID de pagamento no Mercado Pago. Gere o PIX ou conclua o checkout para criar o pagamento; depois use «Sincronizar».",
          },
          400
        );
      }

      const mpNumericId = Number(rawPid);
      if (!Number.isFinite(mpNumericId) || mpNumericId <= 0) {
        return c.json(
          {
            success: false,
            error: "O payment_id salvo no pedido não é um número válido do Mercado Pago.",
          },
          400
        );
      }

      let payment;
      try {
        payment = await getPayment(token, mpNumericId);
      } catch (e: unknown) {
        return c.json({ success: false, error: formatMercadoPagoFetchError(e) }, 502);
      }

      const reconcile = await applyMercadoPagoPaymentSnapshotToOrder(c.env, { orderId, payment });

      await logAction(c, "SYNC_ORDER_MP_PAYMENT", "order", orderId, {
        actor: "admin_panel_manual_sync",
        mp_payment_id: payment.id,
        mp_status: payment.status,
        reconcile_kind: reconcile.kind,
        ...(reconcile.kind === "approval" ? { approval_outcome: reconcile.outcome } : {}),
        ...(reconcile.kind === "ignored" ? { ignored_reason: reconcile.reason } : {}),
      });

      const refreshed = await getOrderWithItems(c.env, orderId, store.id);
      const orderPayload = refreshed
        ? { ...refreshed, items: Array.isArray(refreshed.items) ? refreshed.items : [] }
        : null;

      return c.json(
        {
          success: true,
          data: {
            message: reconcile.userMessage,
            mpStatus: payment.status,
            resultKind: reconcile.kind,
            ...(reconcile.kind === "approval" ? { outcome: reconcile.outcome } : {}),
            order: orderPayload,
          },
        },
        200
      );
    } catch (err: unknown) {
      logServerError("admin.post /orders/:id/sync-payment", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });
};
