import { useCallback, useState } from "react";
import { useAdminCategoriesQuery } from "@/react-app/hooks/useAdminCategoriesQuery";
import { useAdminCategoryMutations } from "@/react-app/hooks/admin/useAdminCategoryMutations";
import { useToast } from "@/react-app/providers/ToastProvider";
import type { Category } from "@/react-app/types";
import { formValuesToCreatePayload, formValuesToUpdatePayload, type AdminCategoryFormValues } from "@/schemas/adminCategoryForm";

export function useAdminCategories() {
  const categoriesQuery = useAdminCategoriesQuery();
  const mutations = useAdminCategoryMutations();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const categories = categoriesQuery.data ?? [];
  const loading = categoriesQuery.isPending && categoriesQuery.data === undefined;
  const refetching = categoriesQuery.isFetching && categoriesQuery.data !== undefined;
  const loadError =
    categoriesQuery.error instanceof Error
      ? categoriesQuery.error.message
      : categoriesQuery.error
        ? String(categoriesQuery.error)
        : null;
  const error = actionError ?? loadError;

  const handleCreate = useCallback(
    async (values: AdminCategoryFormValues) => {
      setActionError(null);
      try {
        await mutations.createMutation.mutateAsync(formValuesToCreatePayload(values));
        showToast({ type: "success", message: "Categoria criada." });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao criar categoria.";
        setActionError(message);
        showToast({ type: "error", message });
        throw err;
      }
    },
    [mutations.createMutation, showToast],
  );

  const handleUpdate = useCallback(
    async (categoryId: string, values: AdminCategoryFormValues) => {
      setActionError(null);
      try {
        await mutations.updateMutation.mutateAsync({
          categoryId,
          payload: formValuesToUpdatePayload(values),
        });
        setEditingId(null);
        showToast({ type: "success", message: "Categoria atualizada." });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao salvar categoria.";
        setActionError(message);
        showToast({ type: "error", message });
        throw err;
      }
    },
    [mutations.updateMutation, showToast],
  );

  const handleDelete = useCallback(
    async (categoryId: string) => {
      setActionError(null);
      try {
        await mutations.deleteMutation.mutateAsync(categoryId);
        setDeleteTarget(null);
        showToast({ type: "success", message: "Categoria excluída." });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao excluir categoria.";
        setActionError(message);
        showToast({ type: "error", message });
        throw err;
      }
    },
    [mutations.deleteMutation, showToast],
  );

  return {
    categories,
    loading,
    refetching,
    error,
    editingId,
    setEditingId,
    deleteTarget,
    setDeleteTarget,
    creating: mutations.createMutation.isPending,
    updatingId: mutations.updateMutation.isPending ? mutations.updateMutation.variables?.categoryId ?? null : null,
    deletingId: mutations.deleteMutation.isPending ? mutations.deleteMutation.variables ?? null : null,
    fetchCategories: () => void categoriesQuery.refetch(),
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}
