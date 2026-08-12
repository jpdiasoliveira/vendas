import { LogOut } from "lucide-react";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar confirmação"
        className="absolute inset-0 bg-surface/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-sm rounded-3xl border border-brand-primary/15 bg-surface-elevated p-8 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
      >
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-red-500/15 p-3">
            <LogOut className="h-8 w-8 text-red-400" aria-hidden />
          </div>
        </div>
        <h2 id="logout-title" className="mb-2 text-center font-display text-xl font-bold text-content">
          Sair da conta?
        </h2>
        <p className="mb-6 text-center text-sm text-content-muted">
          Tem certeza que deseja sair? Você precisará fazer login novamente.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-brand-primary/20 bg-surface-elevated py-2.5 text-sm font-medium text-content-muted transition hover:bg-surface-muted hover:text-content"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
