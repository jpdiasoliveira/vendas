import { Loader2 } from "lucide-react";

type AdminStoreMemberDeleteModalProps = {
  isOpen: boolean;
  email: string;
  removing: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function AdminStoreMemberDeleteModal({
  isOpen,
  email,
  removing,
  onClose,
  onConfirm,
}: AdminStoreMemberDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-surface/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-member-title"
        className="w-full max-w-md rounded-2xl border border-brand-primary/15 bg-surface p-6 shadow-2xl"
      >
        <h2 id="remove-member-title" className="font-display text-lg font-bold text-content">
          Remover membro
        </h2>
        <p className="mt-2 text-sm text-content-muted">
          Remover <span className="font-medium text-content">{email}</span> da equipe? O acesso ao painel desta loja será
          revogado.
        </p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={removing}
            className="flex-1 rounded-xl border border-brand-primary/15 bg-surface-elevated py-2.5 text-sm font-medium text-content-muted hover:bg-surface-muted disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={removing}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
          >
            {removing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {removing ? "Removendo…" : "Remover"}
          </button>
        </div>
      </div>
    </div>
  );
}
