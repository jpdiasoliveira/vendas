import { useEffect } from "react";
import { useOutletContext } from "react-router";
import { RefreshCw } from "lucide-react";
import type { AdminStoreHubOutletContext } from "@/react-app/components/admin/adminStoreHubOutletContext";
import { AdminCouponDeleteModal } from "@/react-app/components/admin/coupons/AdminCouponDeleteModal";
import { AdminCouponForm } from "@/react-app/components/admin/coupons/AdminCouponForm";
import { AdminCouponsList } from "@/react-app/components/admin/coupons/AdminCouponsList";
import { useAdminCoupons } from "@/react-app/hooks/useAdminCoupons";

const AdminCouponsPage = () => {
  const m = useAdminCoupons();
  const { setStoreHubToolbar } = useOutletContext<AdminStoreHubOutletContext>();

  useEffect(() => {
    setStoreHubToolbar(
      <button
        type="button"
        onClick={() => void m.fetchCoupons()}
        disabled={m.loading}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-brand-primary/20 bg-surface-elevated px-3 py-2 text-sm font-medium text-content-muted transition hover:bg-surface-muted hover:text-content disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 shrink-0 ${m.refetching ? "animate-spin" : ""}`} />
        Atualizar
      </button>,
    );
    return () => setStoreHubToolbar(null);
  }, [m.fetchCoupons, m.loading, m.refetching, setStoreHubToolbar]);

  return (
    <div className="w-full min-w-0">
      <p className="mb-4 text-sm text-content-muted">
        Cupons aplicados no checkout. O desconto é sempre recalculado no servidor ao criar o pedido.
      </p>
      <div className="rounded-3xl border border-brand-primary/10 bg-surface-elevated p-5 sm:p-8">
        {m.error ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {m.error}
          </div>
        ) : null}

        <AdminCouponForm creating={m.creating} onSubmit={m.handleCreate} />
        <AdminCouponsList
          coupons={m.coupons}
          loading={m.loading}
          editingId={m.editingId}
          updatingId={m.updatingId}
          onEdit={(coupon) => m.setEditingId(coupon.id)}
          onCancelEdit={() => m.setEditingId(null)}
          onSave={m.handleUpdate}
          onDelete={m.setDeleteTarget}
        />
      </div>

      {m.deleteTarget ? (
        <AdminCouponDeleteModal
          isOpen
          code={m.deleteTarget.code}
          deleting={m.deletingId === m.deleteTarget.id}
          onClose={() => m.setDeleteTarget(null)}
          onConfirm={() => m.handleDelete(m.deleteTarget!.id)}
        />
      ) : null}
    </div>
  );
};

export default AdminCouponsPage;
