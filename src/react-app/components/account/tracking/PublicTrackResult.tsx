import { Link } from "react-router";
import type { OrderWithItems } from "@/react-app/types";
import { OrderConfirmationTracking } from "@/react-app/components/account/confirmation/OrderConfirmationTracking";
import { PublicTrackTimeline } from "@/react-app/components/account/tracking/PublicTrackTimeline";
import { formatCurrency } from "@/react-app/utils/format";

type PublicTrackResultProps = {
  order: OrderWithItems;
  paymentApproved: boolean;
  preparing: boolean;
  logistics: { cancelled: boolean; shipped: boolean; delivered: boolean };
  rawTracking: string;
  trackingUrl: string;
};

export function PublicTrackResult({
  order,
  paymentApproved,
  preparing,
  logistics,
  rawTracking,
  trackingUrl,
}: PublicTrackResultProps) {
  return (
    <div className="space-y-6 rounded-3xl border border-brand-primary/15 bg-surface-elevated p-6 shadow-xl">
      <div>
        <p className="font-mono text-xs text-content-muted">#{order.id}</p>
        <p className="mt-1 font-display text-xl font-bold text-brand-primary">{formatCurrency(order.total)}</p>
      </div>

      <PublicTrackTimeline
        paymentApproved={paymentApproved}
        preparing={preparing}
        shipped={logistics.shipped}
        delivered={logistics.delivered}
        hasTracking={Boolean(rawTracking)}
      />

      {logistics.shipped && rawTracking ? (
        <OrderConfirmationTracking
          trackingCode={rawTracking}
          trackingUrl={trackingUrl}
          shippingMethod={order.shippingMethod}
        />
      ) : null}

      {logistics.cancelled ? (
        <p className="rounded-xl border border-brand-primary/15 bg-surface-muted/50 p-3 text-center text-sm text-content-muted">
          Este pedido foi cancelado.
        </p>
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
