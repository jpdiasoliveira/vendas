import { Check, Copy } from "lucide-react";
import type { CheckoutPixData } from "@/react-app/types/checkout";

type CheckoutPixQrPanelProps = {
  pixData: CheckoutPixData;
  copied: boolean;
  onCopy: (text: string) => void;
};

export function CheckoutPixQrPanel({ pixData, copied, onCopy }: CheckoutPixQrPanelProps) {
  return (
    <div className="space-y-4 text-left">
      <p className="text-center font-body text-sm text-content-muted">
        Escaneie o QR Code ou copie o código Pix
      </p>
      {pixData.qrCodeBase64 ? (
        <div className="mx-auto max-w-[14rem] rounded-2xl border border-brand-primary/15 bg-surface-elevated p-3">
          <img
            src={`data:image/png;base64,${pixData.qrCodeBase64}`}
            alt="QR Code Pix"
            className="aspect-square w-full object-contain"
          />
        </div>
      ) : null}
      {pixData.copyPaste ? (
        <div className="rounded-xl border border-brand-primary/15 bg-surface-muted/50 p-3">
          <p className="mb-2 text-xs font-medium text-content-muted">Pix Copia e Cola</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={pixData.copyPaste}
              className="min-h-[44px] flex-1 rounded-xl border border-brand-primary/20 bg-surface px-3 font-mono text-xs text-content"
              aria-label="Código Pix copia e cola"
            />
            <button
              type="button"
              onClick={() => onCopy(pixData.copyPaste)}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>
      ) : null}
      <p className="text-center text-xs text-content-muted">
        A confirmação é verificada automaticamente a cada 5s.
      </p>
    </div>
  );
}
