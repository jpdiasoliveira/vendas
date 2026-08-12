import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type PlatformConfirmDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function PlatformConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  onConfirm,
  onClose,
}: PlatformConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={() => !loading && onClose()}
        aria-label="Fechar"
      />
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-brand-primary/20 bg-surface-elevated p-6 shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="platform-confirm-title"
      >
        <div className="mb-3 flex justify-center">
          <div className="rounded-full bg-amber-500/15 p-3">
            <AlertTriangle className="h-8 w-8 text-amber-400" aria-hidden />
          </div>
        </div>
        <h3 id="platform-confirm-title" className="text-center font-display text-lg font-semibold text-content">
          {title}
        </h3>
        <div className="mt-4 text-sm text-content-muted">{children}</div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 rounded-xl border border-brand-primary/20 py-2.5 text-sm font-medium text-content-muted transition hover:bg-surface-muted disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-bold text-white transition hover:bg-amber-500 disabled:opacity-50"
          >
            {loading ? "A gravar…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
