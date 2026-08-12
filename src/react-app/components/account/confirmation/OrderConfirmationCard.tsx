import { Link } from "react-router";
import type { OrderWithItems } from "@/react-app/types";
import { OrderConfirmationTimeline } from "@/react-app/components/account/confirmation/OrderConfirmationTimeline";
import { OrderConfirmationTracking } from "@/react-app/components/account/confirmation/OrderConfirmationTracking";
import { OrderStockConflictAlert } from "@/react-app/components/account/confirmation/OrderConfirmationError";
import { formatCurrency } from "@/react-app/utils/format";

type OrderConfirmationCardProps = {
  order: OrderWithItems;
  stockConflict: boolean;
  paymentApproved: boolean;
  logistics: { cancelled: boolean; shipped: boolean; delivered: boolean };
  rawTracking: string;
  trackingUrl: string;
  isShippedStatus: boolean;
};

export function OrderConfirmationCard({
  order,
  stockConflict,
  paymentApproved,
  logistics,
  rawTracking,
  trackingUrl,
  isShippedStatus,
}: OrderConfirmationCardProps) {
  return (
    <div className="space-y-6 rounded-3xl border border-brand-primary/15 bg-surface-elevated p-6 shadow-xl">
      {stockConflict ? <OrderStockConflictAlert /> : null}
      {logistics.cancelled && !stockConflict ? (
        <div className="rounded-2xl border border-brand-primary/15 bg-surface-muted/50 p-4 text-sm text-content-muted">
          Este pedido foi cancelado.
        </div>
      ) : null}

      <div>
        <p className="font-mono text-xs text-content-muted">#{order.id}</p>
        <p className="mt-1 font-display text-xl font-bold text-brand-primary">{formatCurrency(order.total)}</p>
      </div>

      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Pagamento</p>
        <p className="mt-1 font-body text-sm text-content">
          {paymentApproved ? "Confirmado — obrigado pela compra." : "Aguardando confirmação do pagamento."}
        </p>
      </div>

      <OrderConfirmationTimeline
        paymentApproved={paymentApproved}
        shipped={logistics.shipped}
        delivered={logistics.delivered}
        awaitingTracking={logistics.shipped && !rawTracking}
      />

      {isShippedStatus && rawTracking ? (
        <OrderConfirmationTracking
          trackingCode={rawTracking}
          trackingUrl={trackingUrl}
          shippingMethod={order.shippingMethod}
        />
      ) : null}

      <Link
        to="/"
        className="block w-full rounded-full border border-brand-primary/20 py-3 text-center font-body text-sm font-semibold text-content transition hover:bg-surface-muted"
      >
        Voltar à loja
      </Link>
    </div>
  );
}
