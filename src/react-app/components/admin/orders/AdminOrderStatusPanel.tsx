import { Loader2, RefreshCw, Send } from "lucide-react";
import type { OrderDetail } from "@/react-app/types";
import { StatusBadge } from "@/react-app/components/admin/StatusBadge";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import {
  STATUS_OPTIONS,
  orderNeedsCancellationMotive,
} from "@/react-app/utils/admin/orderDetails";

type AdminOrderStatusPanelProps = {
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
  canSyncPayment?: boolean;
};

export function AdminOrderStatusPanel({
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
  canSyncPayment = true,
}: AdminOrderStatusPanelProps) {
  return (
    <section className="mt-6 border-t border-brand-primary/10 pt-6">
      <h3 className="mb-3 font-semibold text-content">Status e pagamento</h3>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <StatusBadge status={order.paymentStatus ?? order.status ?? "pending"} />
        {order.paymentId?.trim() && canSyncPayment ? (
          <button
            type="button"
            onClick={onSyncPayment}
            disabled={syncPaymentLoading}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-brand-primary/20 bg-surface-muted px-4 py-2.5 text-sm font-semibold text-content transition-colors hover:bg-surface-elevated disabled:opacity-60"
          >
            {syncPaymentLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            {syncPaymentLoading ? "Sincronizando…" : "Sincronizar pagamento"}
          </button>
        ) : order.paymentId?.trim() ? null : (
          <p className="text-sm text-content-muted">
            Gere o PIX ou o checkout para obter o ID do pagamento no Mercado Pago.
          </p>
        )}
      </div>
      {syncPaymentMessage ? (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200" role="status">
          {syncPaymentMessage}
        </div>
      ) : null}
      {formError ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200" role="alert">
          {formError}
        </div>
      ) : null}
      <h3 className="mb-3 font-semibold text-content">Alterar status</h3>
      {statusSuccessMessage ? (
        <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200" role="status">
          {statusSuccessMessage}
        </div>
      ) : null}
      {selectedStatus === "cancelled" && orderNeedsCancellationMotive(order) ? (
        <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100" role="alert">
          <p className="font-semibold">Estorno manual pode ser necessário</p>
          <p className="mt-1">
            Este pedido já consta como pago ou em etapa avançada. Verifique o gateway antes de cancelar.
          </p>
        </div>
      ) : null}
      {selectedStatus === "cancelled" ? (
        <div className="mb-3">
          <label htmlFor="order-cancel-reason" className="mb-1 block text-sm font-medium text-content-muted">
            Motivo do cancelamento
            {orderNeedsCancellationMotive(order) ? <span className="text-red-400"> *</span> : null}
          </label>
          <textarea
            id="order-cancel-reason"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            rows={3}
            placeholder="Ex.: cliente desistiu; duplicidade; falha na entrega…"
            className={`${storefrontInputClass} resize-y`}
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className={`${storefrontInputClass} min-h-[48px] sm:min-w-[180px] sm:w-auto`}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onSubmitStatus}
          disabled={updating}
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60 sm:w-auto"
        >
          {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          {updating ? "Salvando..." : "Atualizar status"}
        </button>
      </div>
    </section>
  );
}
