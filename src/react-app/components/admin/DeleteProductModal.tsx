import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteProductModalProps {
  isOpen: boolean;
  productName: string;
  productId: string;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export function DeleteProductModal({
  isOpen,
  productName,
  productId,
  onClose,
  onConfirm,
}: DeleteProductModalProps) {
  const [deleting, setDeleting] = useState(false);
  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm(productId);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Excluir Produto?</h2>
        <p className="text-sm text-slate-600 mb-6">
          Esta ação não pode ser desfeita. O produto <strong>{productName}</strong> será removido permanentemente do catálogo.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {deleting ? "Excluindo..." : "Sim, Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
