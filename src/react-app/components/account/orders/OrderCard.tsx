import { CheckCircle, CreditCard, ExternalLink, Package, Truck } from "lucide-react";
import type { Order } from "@/react-app/types";
import { AuthPulseButton } from "@/react-app/components/auth/AuthPulseButton";
import { formatCurrency } from "@/react-app/utils/format";
import { buildTrackingExternalUrl } from "@/react-app/utils/trackingCarrierUrl";
import {
  formatOrderDate,
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusBadgeClass,
  getPaymentStatusLabel,
} from "@/react-app/utils/orderDisplay";

type OrderCardProps = {
  order: Order;
  onPay: (orderId: string, total: number) => void;
};

export function OrderCard({ order, onPay }: OrderCardProps) {
  const statusLower = (order.status ?? "").toLowerCase();
  const isShipped = statusLower === "shipped" || statusLower === "delivered";
  const trackingCode = order.trackingCode?.trim() ?? "";
  const canPay = order.status === "pending" && order.paymentStatus === "pending";

  return (
    <article className="rounded-3xl border border-brand-primary/15 bg-surface-elevated p-6 shadow-xl transition hover:border-brand-primary/25 md:p-8">
      <div className="mb-8 flex flex-col justify-between gap-6 border-b border-brand-primary/10 pb-6 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h3 className="font-display text-xl font-bold text-content">Pedido #{order.id}</h3>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getOrderStatusBadgeClass(order.status ?? "")}`}
            >
              {getOrderStatusLabel(order.status ?? "")}
            </span>
          </div>
          <p className="font-body text-sm text-content-muted">Realizado em {formatOrderDate(order.createdAt)}</p>
        </div>
        <div className="md:text-right">
          <p className="mb-1 font-body text-sm text-content-muted">Total do pedido</p>
          <p className="font-display text-2xl font-bold text-brand-primary">{formatCurrency(order.total)}</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h4 className="mb-4 font-body text-sm font-semibold uppercase tracking-wider text-content-muted">
            Status do pagamento
          </h4>
          <div className="flex items-center justify-between rounded-2xl border border-brand-primary/10 bg-surface-muted/50 p-4">
            <div className="flex items-center gap-3 text-content-muted">
              <CreditCard className="h-5 w-5 shrink-0" aria-hidden />
              <span className="font-body">{getPaymentMethodLabel(order.paymentMethod)}</span>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentStatusBadgeClass(order.paymentStatus)}`}
            >
              {getPaymentStatusLabel(order.paymentStatus)}
            </span>
          </div>

          {canPay ? (
            <AuthPulseButton
              type="button"
              className="mt-4"
              onClick={() => onPay(order.id, order.total)}
            >
              <CreditCard className="h-5 w-5" aria-hidden />
              Pagar agora
            </AuthPulseButton>
          ) : null}
        </div>

        <div>
          <h4 className="mb-4 font-body text-sm font-semibold uppercase tracking-wider text-content-muted">
            Acompanhamento
          </h4>
          <div className="space-y-3 text-sm text-content-muted">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 shrink-0 text-accent" aria-hidden />
              <div>
                <span className="font-medium text-content">Recebido</span>
                <p className="text-xs">Pedido registrado na loja.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              {order.paymentStatus === "approved" ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-accent" aria-hidden />
              ) : (
                <Package className="h-5 w-5 shrink-0 text-content-muted/40" aria-hidden />
              )}
              <div>
                <span className="font-medium text-content">Pagamento</span>
                <p className="text-xs">
                  {order.paymentStatus === "approved"
                    ? "Confirmado — permanece válido após o envio."
                    : "Aguardando confirmação."}
                </p>
              </div>
            </div>
            {isShipped ? (
              <div className="flex items-start gap-2">
                <Truck className="h-5 w-5 shrink-0 text-brand-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-content">Envio</span>
                  {trackingCode ? (
                    <>
                      <p className="mt-1 break-all font-mono text-xs text-content">{trackingCode}</p>
                      <a
                        href={buildTrackingExternalUrl(trackingCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary underline-offset-2 hover:underline"
                      >
                        Rastrear
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </>
                  ) : (
                    <p className="text-xs">Em trânsito — código de rastreio em breve.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
