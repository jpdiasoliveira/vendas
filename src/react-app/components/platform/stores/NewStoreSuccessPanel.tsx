import { CheckCircle2 } from "lucide-react";
import type { CreatedPlatformStore } from "@/react-app/services/api";

type NewStoreSuccessPanelProps = {
  created: CreatedPlatformStore;
  onUseStore: () => void;
  onClose: () => void;
};

export function NewStoreSuccessPanel({ created, onUseStore, onClose }: NewStoreSuccessPanelProps) {
  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
      <div className="flex gap-2">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
        <div>
          <p className="font-semibold text-content">{created.displayName}</p>
          <p className="mt-1 text-sm text-content-muted">
            Link da loja: <span className="font-mono text-content">{created.slug}</span>
          </p>
          {created.subscriptionWarning ? (
            <p className="mt-2 rounded-lg bg-amber-500/15 px-2 py-1.5 text-xs text-amber-200">
              Assinatura da plataforma: {created.subscriptionWarning}
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onUseStore}
        className="w-full rounded-xl bg-brand-primary py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
      >
        Usar esta loja neste navegador
      </button>
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-xl border border-brand-primary/20 py-2.5 text-sm font-medium text-content-muted transition hover:bg-surface-muted"
      >
        Fechar
      </button>
    </div>
  );
}
