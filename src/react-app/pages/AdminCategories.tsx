import { useEffect } from "react";
import { useOutletContext } from "react-router";
import { RefreshCw } from "lucide-react";
import type { AdminCatalogHubOutletContext } from "@/react-app/components/admin/adminCatalogHubOutletContext";
import { AdminCategoryForm } from "@/react-app/components/admin/categories/AdminCategoryForm";
import { AdminCategoriesList } from "@/react-app/components/admin/categories/AdminCategoriesList";
import { AdminCategoryDeleteModal } from "@/react-app/components/admin/categories/AdminCategoryDeleteModal";
import { useAdminCategories } from "@/react-app/hooks/useAdminCategories";

const AdminCategoriesPage = () => {
  const m = useAdminCategories();
  const { setCatalogHubToolbar } = useOutletContext<AdminCatalogHubOutletContext>();

  useEffect(() => {
    setCatalogHubToolbar(
      <button
        type="button"
        onClick={() => void m.fetchCategories()}
        disabled={m.loading}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-brand-primary/20 bg-surface-elevated px-3 py-2 text-sm font-medium text-content-muted transition hover:bg-surface-muted hover:text-content disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 shrink-0 ${m.refetching ? "animate-spin" : ""}`} />
        Atualizar
      </button>,
    );
    return () => setCatalogHubToolbar(null);
  }, [m.fetchCategories, m.loading, m.refetching, setCatalogHubToolbar]);

  return (
    <div className="w-full min-w-0">
      <div className="rounded-3xl border border-brand-primary/10 bg-surface-elevated p-5 sm:p-8">
        {m.error ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">{m.error}</div>
        ) : null}

        <AdminCategoryForm creating={m.creating} onSubmit={m.handleCreate} />

        <AdminCategoriesList
          categories={m.categories}
          loading={m.loading}
          editingId={m.editingId}
          updatingId={m.updatingId}
          onEdit={(category) => m.setEditingId(category.id)}
          onCancelEdit={() => m.setEditingId(null)}
          onSave={m.handleUpdate}
          onDelete={m.setDeleteTarget}
        />
      </div>

      {m.deleteTarget ? (
        <AdminCategoryDeleteModal
          isOpen
          categoryName={m.deleteTarget.name}
          deleting={m.deletingId === m.deleteTarget.id}
          onClose={() => m.setDeleteTarget(null)}
          onConfirm={() => m.handleDelete(m.deleteTarget!.id)}
        />
      ) : null}
    </div>
  );
};

export default AdminCategoriesPage;
