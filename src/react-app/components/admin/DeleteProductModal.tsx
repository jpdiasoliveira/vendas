import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { AdminModalShell } from "@/react-app/components/admin/AdminModalShell";
import { useToast } from "@/react-app/providers/ToastProvider";

type DeleteProductModalProps = {
  isOpen: boolean;
  productName: string;
  productId: string;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
};

export function DeleteProductModal({
  isOpen,
  productName,
  productId,
  onClose,
  onConfirm,
}: DeleteProductModalProps) {
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm(productId);
      onClose();
    } catch (err: unknown) {
      showToast({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao excluir produto.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Excluir produto?"
      description={`Esta ação não pode ser desfeita. O produto «${productName}» será removido permanentemente do catálogo.`}
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={deleting}
          className="flex-1 rounded-xl border border-brand-primary/15 bg-surface-elevated py-2.5 text-sm font-medium text-content-muted hover:bg-surface-muted disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={deleting}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {deleting ? "Excluindo..." : "Sim, excluir"}
        </button>
      </div>
    </AdminModalShell>
  );
}
