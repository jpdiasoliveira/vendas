import { ExternalLink } from "lucide-react";

type OrderConfirmationTrackingProps = {
  trackingCode: string;
  trackingUrl: string;
  shippingMethod?: string | null;
};

export function OrderConfirmationTracking({
  trackingCode,
  trackingUrl,
  shippingMethod,
}: OrderConfirmationTrackingProps) {
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">Seu pedido foi enviado</p>
      <p className="mt-2 font-mono text-lg font-bold tracking-tight text-content sm:text-xl">{trackingCode}</p>
      {shippingMethod?.trim() ? (
        <p className="mt-2 text-sm font-medium text-content-muted">{shippingMethod.trim()}</p>
      ) : null}
      {trackingUrl ? (
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover"
        >
          Abrir rastreio
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
        </a>
      ) : null}
      <p className="mt-3 text-xs text-content-muted">
        Códigos no formato dos Correios abrem direto no rastreador oficial; demais abrem uma busca segura pelo código.
      </p>
    </div>
  );
}
