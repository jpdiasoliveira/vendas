import { useEffect } from "react";
import { useOutletContext } from "react-router";
import { RefreshCw } from "lucide-react";
import type { AdminStoreHubOutletContext } from "@/react-app/components/admin/adminStoreHubOutletContext";
import { AdminShippingFareBandDeleteModal } from "@/react-app/components/admin/shipping/AdminShippingFareBandDeleteModal";
import { AdminShippingFareBandForm } from "@/react-app/components/admin/shipping/AdminShippingFareBandForm";
import { AdminShippingFareBandsList } from "@/react-app/components/admin/shipping/AdminShippingFareBandsList";
import { useAdminShippingFareBands } from "@/react-app/hooks/useAdminShippingFareBands";

const AdminShippingFareBandsPage = () => {
  const m = useAdminShippingFareBands();
  const { setStoreHubToolbar } = useOutletContext<AdminStoreHubOutletContext>();

  useEffect(() => {
    setStoreHubToolbar(
      <button
        type="button"
        onClick={() => void m.fetchBands()}
        disabled={m.loading}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-brand-primary/20 bg-surface-elevated px-3 py-2 text-sm font-medium text-content-muted transition hover:bg-surface-muted hover:text-content disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 shrink-0 ${m.refetching ? "animate-spin" : ""}`} />
        Atualizar
      </button>,
    );
    return () => setStoreHubToolbar(null);
  }, [m.fetchBands, m.loading, m.refetching, setStoreHubToolbar]);

  return (
    <div className="w-full min-w-0">
      <p className="mb-4 text-sm text-content-muted">
        Defina faixas de CEP e o valor do frete. O checkout usa a primeira faixa que incluir o CEP informado.
      </p>
      <div className="rounded-3xl border border-brand-primary/10 bg-surface-elevated p-5 sm:p-8">
        {m.error ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {m.error}
          </div>
        ) : null}

        <AdminShippingFareBandForm creating={m.creating} onSubmit={m.handleCreate} />
        <AdminShippingFareBandsList
          bands={m.bands}
          loading={m.loading}
          editingId={m.editingId}
          updatingId={m.updatingId}
          onEdit={(band) => m.setEditingId(band.id)}
          onCancelEdit={() => m.setEditingId(null)}
          onSave={m.handleUpdate}
          onDelete={m.setDeleteTarget}
        />
      </div>

      {m.deleteTarget ? (
        <AdminShippingFareBandDeleteModal
          isOpen
          cepFrom={m.deleteTarget.cepFrom}
          cepTo={m.deleteTarget.cepTo}
          deleting={m.deletingId === m.deleteTarget.id}
          onClose={() => m.setDeleteTarget(null)}
          onConfirm={() => m.handleDelete(m.deleteTarget!.id)}
        />
      ) : null}
    </div>
  );
};

export default AdminShippingFareBandsPage;
