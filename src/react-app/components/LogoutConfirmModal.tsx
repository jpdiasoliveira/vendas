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
      <div
        className="absolute inset-0 bg-[#1B4332]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-white/50 font-inter"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
      >
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-red-50 p-3">
            <LogOut className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h2 id="logout-title" className="text-xl font-bold text-[#1B4332] text-center mb-2">
          Sair da conta?
        </h2>
        <p className="text-[#6D4C41] text-center text-sm mb-6">
          Tem certeza que deseja sair? Você precisará fazer login novamente.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#6D4C41] bg-white border border-[#1B4332]/20 hover:bg-[#FAF8F3] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
