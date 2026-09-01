import { Loader2, Trash2 } from "lucide-react";
import { AdminModalShell } from "@/react-app/components/admin/AdminModalShell";

type AdminCouponDeleteModalProps = {
  isOpen: boolean;
  code: string;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function AdminCouponDeleteModal({
  isOpen,
  code,
  deleting,
  onClose,
  onConfirm,
}: AdminCouponDeleteModalProps) {
  return (
    <AdminModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Excluir cupom?"
      description={`O cupom «${code}» será removido. Pedidos antigos mantêm o código gravado no pedido.`}
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
          onClick={() => void onConfirm()}
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
