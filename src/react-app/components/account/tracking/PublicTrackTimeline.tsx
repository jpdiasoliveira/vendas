import { CheckCircle2, Circle, Package, Truck } from "lucide-react";

type PublicTrackTimelineProps = {
  paymentApproved: boolean;
  preparing: boolean;
  shipped: boolean;
  delivered: boolean;
  hasTracking: boolean;
};

export function PublicTrackTimeline({
  paymentApproved,
  preparing,
  shipped,
  delivered,
  hasTracking,
}: PublicTrackTimelineProps) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-content-muted">Status do envio</p>
      <ol className="space-y-4">
        <li className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" aria-hidden />
          <div>
            <p className="font-body text-sm font-medium text-content">Pedido recebido</p>
            <p className="text-xs text-content-muted">Registramos seu pedido.</p>
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
              {paymentApproved ? "Pagamento confirmado." : "Aguardando confirmação do pagamento."}
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3">
          {preparing || shipped || delivered ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" aria-hidden />
          ) : (
            <Circle className="mt-0.5 h-5 w-5 shrink-0 text-content-muted/30" aria-hidden />
          )}
          <div>
            <p
              className={`font-body text-sm font-medium ${preparing || shipped ? "text-content" : "text-content-muted"}`}
            >
              Em preparo
            </p>
            <p className="text-xs text-content-muted">
              {shipped || delivered
                ? "Pedido seguiu para envio."
                : preparing
                  ? "Estamos preparando seu pedido."
                  : "Aguardando pagamento ou envio."}
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
              <p className="text-xs text-content-muted">Código de rastreio aparece aqui quando a loja enviar.</p>
            ) : !hasTracking ? (
              <p className="text-xs text-amber-200">Enviado — código em breve.</p>
            ) : null}
          </div>
          <Truck className="ml-auto h-4 w-4 text-content-muted/35" aria-hidden />
        </li>
      </ol>
    </div>
  );
}
