import { CheckCircle2, Circle, Package, Truck } from "lucide-react";

type OrderConfirmationTimelineProps = {
  paymentApproved: boolean;
  shipped: boolean;
  delivered: boolean;
  awaitingTracking?: boolean;
};

export function OrderConfirmationTimeline({
  paymentApproved,
  shipped,
  delivered,
  awaitingTracking = false,
}: OrderConfirmationTimelineProps) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-content-muted">Acompanhamento</p>
      <ol className="space-y-4">
        <li className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" aria-hidden />
          <div>
            <p className="font-body text-sm font-medium text-content">Recebido</p>
            <p className="text-xs text-content-muted">Seu pedido foi registrado.</p>
          </div>
          <Package className="ml-auto h-4 w-4 text-content-muted/35" aria-hidden />
        </li>
        <li className="flex items-start gap-3">
          {paymentApproved ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" aria-hidden />
          ) : (
            <Circle className="mt-0.5 h-5 w-5 shrink-0 text-content-muted/30" aria-hidden />
          )}
          <div>
            <p className={`font-body text-sm font-medium ${paymentApproved ? "text-content" : "text-content-muted"}`}>
              Pago
            </p>
            <p className="text-xs text-content-muted">
              {paymentApproved ? "Pagamento confirmado." : "Aguardando confirmação."}
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3">
          {shipped ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" aria-hidden />
          ) : (
            <Circle className="mt-0.5 h-5 w-5 shrink-0 text-content-muted/30" aria-hidden />
          )}
          <div>
            <p className={`font-body text-sm font-medium ${shipped ? "text-content" : "text-content-muted"}`}>
              Enviado
            </p>
            {!shipped ? (
              <p className="text-xs text-content-muted">Em preparação.</p>
            ) : awaitingTracking ? (
              <p className="text-xs text-amber-200">Enviado — código de rastreio em breve.</p>
            ) : null}
          </div>
          <Truck className="ml-auto h-4 w-4 text-content-muted/35" aria-hidden />
        </li>
        <li className="flex items-start gap-3">
          {delivered ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" aria-hidden />
          ) : (
            <Circle className="mt-0.5 h-5 w-5 shrink-0 text-content-muted/30" aria-hidden />
          )}
          <div>
            <p className={`font-body text-sm font-medium ${delivered ? "text-content" : "text-content-muted"}`}>
              Entregue
            </p>
          </div>
        </li>
      </ol>
    </div>
  );
}
