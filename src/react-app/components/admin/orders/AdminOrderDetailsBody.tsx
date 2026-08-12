import { Loader2, MessageCircle } from "lucide-react";
import type { OrderDetail } from "@/react-app/types";
import { formatCurrency, formatDate } from "@/react-app/utils/format";
import { StatusBadge } from "@/react-app/components/admin/StatusBadge";
import { AdminOrderItemsPanel } from "@/react-app/components/admin/orders/AdminOrderItemsPanel";
import { AdminOrderStatusPanel } from "@/react-app/components/admin/orders/AdminOrderStatusPanel";
import { buildWhatsAppUrl, getOrderCancellationDisplay } from "@/react-app/utils/admin/orderDetails";

type AdminOrderDetailsBodyProps = {
  order: OrderDetail;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  cancellationReason: string;
  setCancellationReason: (value: string) => void;
  statusSuccessMessage: string | null;
  syncPaymentMessage: string | null;
  formError: string | null;
  updating: boolean;
  syncPaymentLoading: boolean;
  onSyncPayment: () => void;
  onSubmitStatus: () => void;
};

export function AdminOrderDetailsBody({
  order,
  selectedStatus,
  setSelectedStatus,
  cancellationReason,
  setCancellationReason,
  statusSuccessMessage,
  syncPaymentMessage,
  formError,
  updating,
  syncPaymentLoading,
  onSyncPayment,
  onSubmitStatus,
}: AdminOrderDetailsBodyProps) {
  const waUrl = buildWhatsAppUrl(order.customerPhone);
  const stLower = (order.status ?? "").trim().toLowerCase();
  const cancelMeta =
    stLower === "cancelled" || stLower === "canceled"
      ? getOrderCancellationDisplay(order.metadata)
      : { reasonLabel: null as string | null, autoExpiredAt: null as string | null };

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-content-muted">Data</p>
          <p className="font-medium text-content">{formatDate(order.createdAt)}</p>
        </div>
        <div>
          <p className="text-content-muted">Cliente</p>
          <p className="break-words font-medium text-content">{order.customerName?.trim() || "Cliente"}</p>
        </div>
        {order.customerPhone?.trim() ? (
          <div>
            <p className="text-content-muted">Telefone</p>
            <p className="font-medium text-content">{order.customerPhone.trim()}</p>
          </div>
        ) : null}
        <div>
          <p className="text-content-muted">Total</p>
          <p className="font-bold text-content">{formatCurrency(order.total)}</p>
        </div>
        {order.shippingPostalCode?.trim() ? (
          <div>
            <p className="text-content-muted">CEP (frete)</p>
            <p className="font-medium text-content">{order.shippingPostalCode.trim()}</p>
          </div>
        ) : null}
        {order.shippingFee != null && order.shippingFee > 0 ? (
          <div>
            <p className="text-content-muted">Frete</p>
            <p className="font-medium text-content">{formatCurrency(order.shippingFee)}</p>
          </div>
        ) : null}
        {order.couponCode?.trim() ? (
          <div>
            <p className="text-content-muted">Cupom</p>
            <p className="font-medium text-content">
              {order.couponCode.trim()}
              {order.couponDiscount != null && order.couponDiscount > 0
                ? ` (−${formatCurrency(order.couponDiscount)})`
                : ""}
            </p>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <p className="text-content-muted">Status atual</p>
          <StatusBadge status={order.paymentStatus ?? order.status ?? "pending"} />
          {cancelMeta.reasonLabel ? (
            <div className="mt-3 rounded-xl border border-brand-primary/15 bg-surface-muted/50 px-4 py-3 text-sm text-content" role="note">
              <p className="font-semibold">Cancelamento</p>
              <p className="mt-1">{cancelMeta.reasonLabel}</p>
              {cancelMeta.autoExpiredAt ? (
                <p className="mt-2 text-xs text-content-muted">Registo automático (UTC): {cancelMeta.autoExpiredAt}</p>
              ) : null}
            </div>
          ) : null}
        </div>
        {order.deliveryAddress?.trim() ? (
          <div className="sm:col-span-2">
            <p className="text-content-muted">Endereço de entrega</p>
            <p className="whitespace-pre-wrap break-words font-medium text-content">{order.deliveryAddress.trim()}</p>
          </div>
        ) : null}
      </div>

      {waUrl ? (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-950/30 px-4 py-3 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-500/30 transition-colors hover:bg-emerald-950/40"
        >
          <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
          WhatsApp rápido
        </a>
      ) : null}

      <h3 className="mb-3 font-semibold text-content">Itens</h3>
      <AdminOrderItemsPanel items={order.items} />

      <AdminOrderStatusPanel
        order={order}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        cancellationReason={cancellationReason}
        setCancellationReason={setCancellationReason}
        statusSuccessMessage={statusSuccessMessage}
        syncPaymentMessage={syncPaymentMessage}
        formError={formError}
        updating={updating}
        syncPaymentLoading={syncPaymentLoading}
        onSyncPayment={onSyncPayment}
        onSubmitStatus={onSubmitStatus}
      />
    </>
  );
}

export function AdminOrderDetailsLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="mb-4 h-10 w-10 animate-spin text-brand-primary" />
      <p className="text-sm text-content-muted">Carregando pedido...</p>
    </div>
  );
}
