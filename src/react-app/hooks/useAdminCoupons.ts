import { useCallback, useState } from "react";
import { useAdminCouponsQuery } from "@/react-app/hooks/useAdminCouponsQuery";
import { useAdminCouponMutations } from "@/react-app/hooks/admin/useAdminCouponMutations";
import { useToast } from "@/react-app/providers/ToastProvider";
import type { StoreCoupon } from "@/react-app/types";
import {
  formValuesToCreateCouponPayload,
  formValuesToUpdateCouponPayload,
  type AdminCouponFormValues,
} from "@/schemas/adminCouponForm";

export function useAdminCoupons() {
  const couponsQuery = useAdminCouponsQuery();
  const mutations = useAdminCouponMutations();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoreCoupon | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const coupons = couponsQuery.data ?? [];
  const loading = couponsQuery.isPending && couponsQuery.data === undefined;
  const refetching = couponsQuery.isFetching && couponsQuery.data !== undefined;
  const loadError =
    couponsQuery.error instanceof Error
      ? couponsQuery.error.message
      : couponsQuery.error
        ? String(couponsQuery.error)
        : null;
  const error = actionError ?? loadError;

  const handleCreate = useCallback(
    async (values: AdminCouponFormValues) => {
      setActionError(null);
      try {
        await mutations.createMutation.mutateAsync(formValuesToCreateCouponPayload(values));
        showToast({ type: "success", message: "Cupom criado." });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao criar cupom.";
        setActionError(message);
        showToast({ type: "error", message });
        throw err;
      }
    },
    [mutations.createMutation, showToast],
  );

  const handleUpdate = useCallback(
    async (couponId: string, values: AdminCouponFormValues) => {
      setActionError(null);
      try {
        await mutations.updateMutation.mutateAsync({
          couponId,
          payload: formValuesToUpdateCouponPayload(values),
        });
        setEditingId(null);
        showToast({ type: "success", message: "Cupom atualizado." });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao salvar cupom.";
        setActionError(message);
        showToast({ type: "error", message });
        throw err;
      }
    },
    [mutations.updateMutation, showToast],
  );

  const handleDelete = useCallback(
    async (couponId: string) => {
      setActionError(null);
      try {
        await mutations.deleteMutation.mutateAsync(couponId);
        setDeleteTarget(null);
        showToast({ type: "success", message: "Cupom excluído." });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao excluir cupom.";
        setActionError(message);
        showToast({ type: "error", message });
        throw err;
      }
    },
    [mutations.deleteMutation, showToast],
  );

  return {
    coupons,
    loading,
    refetching,
    error,
    editingId,
    setEditingId,
    deleteTarget,
    setDeleteTarget,
    creating: mutations.createMutation.isPending,
    updatingId: mutations.updateMutation.isPending ? mutations.updateMutation.variables?.couponId ?? null : null,
    deletingId: mutations.deleteMutation.isPending ? mutations.deleteMutation.variables ?? null : null,
    fetchCoupons: () => void couponsQuery.refetch(),
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}
