import { useCallback, useState } from "react";
import { useAdminShippingFareBandsQuery } from "@/react-app/hooks/useAdminShippingFareBandsQuery";
import { useAdminShippingFareBandMutations } from "@/react-app/hooks/admin/useAdminShippingFareBandMutations";
import { useToast } from "@/react-app/providers/ToastProvider";
import type { ShippingFareBand } from "@/react-app/types";
import {
  formValuesToCreateShippingPayload,
  formValuesToUpdateShippingPayload,
  type AdminShippingFareBandFormValues,
} from "@/schemas/adminShippingFareBandForm";

export function useAdminShippingFareBands() {
  const bandsQuery = useAdminShippingFareBandsQuery();
  const mutations = useAdminShippingFareBandMutations();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShippingFareBand | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const bands = bandsQuery.data ?? [];
  const loading = bandsQuery.isPending && bandsQuery.data === undefined;
  const refetching = bandsQuery.isFetching && bandsQuery.data !== undefined;
  const loadError =
    bandsQuery.error instanceof Error
      ? bandsQuery.error.message
      : bandsQuery.error
        ? String(bandsQuery.error)
        : null;
  const error = actionError ?? loadError;

  const handleCreate = useCallback(
    async (values: AdminShippingFareBandFormValues) => {
      setActionError(null);
      try {
        await mutations.createMutation.mutateAsync(formValuesToCreateShippingPayload(values));
        showToast({ type: "success", message: "Faixa de frete criada." });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao criar faixa de frete.";
        setActionError(message);
        showToast({ type: "error", message });
        throw err;
      }
    },
    [mutations.createMutation, showToast],
  );

  const handleUpdate = useCallback(
    async (bandId: string, values: AdminShippingFareBandFormValues) => {
      setActionError(null);
      try {
        await mutations.updateMutation.mutateAsync({
          bandId,
          payload: formValuesToUpdateShippingPayload(values),
        });
        setEditingId(null);
        showToast({ type: "success", message: "Faixa de frete atualizada." });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao salvar faixa de frete.";
        setActionError(message);
        showToast({ type: "error", message });
        throw err;
      }
    },
    [mutations.updateMutation, showToast],
  );

  const handleDelete = useCallback(
    async (bandId: string) => {
      setActionError(null);
      try {
        await mutations.deleteMutation.mutateAsync(bandId);
        setDeleteTarget(null);
        showToast({ type: "success", message: "Faixa de frete excluída." });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao excluir faixa de frete.";
        setActionError(message);
        showToast({ type: "error", message });
        throw err;
      }
    },
    [mutations.deleteMutation, showToast],
  );

  return {
    bands,
    loading,
    refetching,
    error,
    editingId,
    setEditingId,
    deleteTarget,
    setDeleteTarget,
    creating: mutations.createMutation.isPending,
    updatingId: mutations.updateMutation.isPending ? mutations.updateMutation.variables?.bandId ?? null : null,
    deletingId: mutations.deleteMutation.isPending ? mutations.deleteMutation.variables ?? null : null,
    fetchBands: () => void bandsQuery.refetch(),
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}
