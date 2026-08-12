import { Loader2 } from "lucide-react";

type CheckoutSubmitOverlayProps = {
  active: boolean;
  message?: string;
};

/** Bloqueia interações durante processamento do pagamento (anti dupla cobrança). */
export function CheckoutSubmitOverlay({
  active,
  message = "Processando pagamento…",
}: CheckoutSubmitOverlayProps) {
  if (!active) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-none bg-surface/85 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-10 w-10 animate-spin text-brand-primary" aria-hidden />
      <p className="font-body text-sm font-medium text-content">{message}</p>
      <p className="max-w-[14rem] text-center text-xs text-content-muted">
        Não feche esta janela até concluir.
      </p>
    </div>
  );
}
