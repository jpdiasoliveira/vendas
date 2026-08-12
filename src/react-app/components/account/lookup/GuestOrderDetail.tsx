import { Check, Copy, ExternalLink, Truck } from "lucide-react";
import type { OrderWithItems } from "@/react-app/types";
import { AuthPulseButton } from "@/react-app/components/auth/AuthPulseButton";
import { GuestOrderItemsList } from "@/react-app/components/account/lookup/GuestOrderItemsList";
import { formatCurrency } from "@/react-app/utils/format";
import { buildTrackingExternalUrl } from "@/react-app/utils/trackingCarrierUrl";
import {
  formatOrderDateShort,
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/react-app/utils/orderDisplay";

type GuestOrderDetailProps = {
  order: OrderWithItems;
  copied: boolean;
  canPay: boolean;
  onCopyId: () => void;
  onPay: () => void;
  onNewSearch: () => void;
};

export function GuestOrderDetail({
  order,
  copied,
  canPay,
  onCopyId,
  onPay,
  onNewSearch,
}: GuestOrderDetailProps) {
  const statusLower = (order.status ?? "").toLowerCase();
  const showTracking = statusLower === "shipped" || statusLower === "delivered";
  const trackingCode = order.trackingCode?.trim() ?? "";

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-2 pr-8">
        <div>
          <h2 className="font-display text-xl font-bold text-content">Pedido encontrado</h2>
          <p className="mt-1 break-all font-mono text-xs text-content-muted sm:text-sm">{order.id}</p>
        </div>
        <button
          type="button"
          onClick={() => void onCopyId()}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-brand-primary/15 px-2 py-1.5 text-xs text-content transition hover:bg-surface-muted"
          aria-label="Copiar número do pedido"
        >
          {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getOrderStatusBadgeClass(order.status ?? "")}`}
        >
          {getOrderStatusLabel(order.status ?? "")}
        </span>
        <span className="font-body text-sm text-content-muted">{formatOrderDateShort(order.createdAt)}</span>
      </div>

      <p className="mb-4 font-display text-lg font-bold text-brand-primary">{formatCurrency(order.total)}</p>

      {order.deliveryAddress?.trim() ? (
        <p className="mb-4 rounded-xl border border-brand-primary/10 bg-surface-muted/50 p-3 text-sm text-content-muted">
          <span className="font-semibold text-content">Entrega: </span>
          {order.deliveryAddress}
        </p>
      ) : null}

      <div className="mb-4 rounded-xl border border-brand-primary/10 bg-surface-muted/40 p-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-content-muted">Pagamento</p>
        <p className="font-body text-sm text-content">
          {getPaymentMethodLabel(order.paymentMethod)} · {getPaymentStatusLabel(order.paymentStatus)}
        </p>
      </div>

      {showTracking ? (
        <div className="mb-4 flex gap-2 rounded-xl border border-brand-primary/10 bg-surface-muted/50 p-3">
          <Truck className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">Rastreio</p>
            {trackingCode ? (
              <>
                <p className="mt-1 break-all font-mono text-sm text-content">{trackingCode}</p>
                <a
                  href={buildTrackingExternalUrl(trackingCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-primary underline-offset-2 hover:underline"
                >
                  Rastrear envio
                  <ExternalLink className="h-4 w-4" />
                </a>
              </>
            ) : (
              <p className="mt-1 text-sm text-content-muted">Envio em andamento; código em breve.</p>
            )}
          </div>
        </div>
      ) : null}

      {order.items ? <GuestOrderItemsList items={order.items} /> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {canPay ? (
          <AuthPulseButton type="button" className="flex-1" onClick={onPay}>
            Pagar agora
          </AuthPulseButton>
        ) : null}
        <AuthPulseButton type="button" variant="outline" className="flex-1" onClick={onNewSearch}>
          Nova busca
        </AuthPulseButton>
      </div>
    </>
  );
}
