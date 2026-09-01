import { useCallback, useState } from "react";
import { useAdminStoreMembersQuery } from "@/react-app/hooks/admin/useAdminStoreMembersQuery";
import { useAdminStoreMemberMutations } from "@/react-app/hooks/admin/useAdminStoreMemberMutations";
import { useToast } from "@/react-app/providers/ToastProvider";
import type { StoreMemberListItem } from "@/react-app/types";
import {
  adminStoreMemberInviteFormSchema,
  inviteFormToApiPayload,
  type AdminStoreMemberInviteFormValues,
} from "@/schemas/adminStoreMemberForm";

export function useAdminStoreMembers() {
  const membersQuery = useAdminStoreMembersQuery();
  const mutations = useAdminStoreMemberMutations();
  const { showToast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<StoreMemberListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const members = membersQuery.data ?? [];
  const loading = membersQuery.isPending && membersQuery.data === undefined;
  const refetching = membersQuery.isFetching && membersQuery.data !== undefined;
  const loadError =
    membersQuery.error instanceof Error
      ? membersQuery.error.message
      : membersQuery.error
        ? String(membersQuery.error)
        : null;
  const error = actionError ?? loadError;

  const handleInvite = useCallback(
    async (values: AdminStoreMemberInviteFormValues) => {
      setActionError(null);
      const parsed = adminStoreMemberInviteFormSchema.parse(values);
      try {
        await mutations.inviteMutation.mutateAsync(inviteFormToApiPayload(parsed));
        showToast({ type: "success", message: "Convite enviado com sucesso." });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao convidar membro.";
        setActionError(message);
        showToast({ type: "error", message });
        throw err;
      }
    },
    [mutations.inviteMutation, showToast],
  );

  const handleRoleChange = useCallback(
    async (memberId: string, role: "staff" | "admin") => {
      setActionError(null);
      setUpdatingId(memberId);
      try {
        await mutations.updateRoleMutation.mutateAsync({ memberId, role });
        showToast({ type: "success", message: "Papel atualizado." });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao atualizar papel.";
        setActionError(message);
        showToast({ type: "error", message });
        throw err;
      } finally {
        setUpdatingId(null);
      }
    },
    [mutations.updateRoleMutation, showToast],
  );

  const handleRemove = useCallback(
    async (memberId: string) => {
      setActionError(null);
      try {
        await mutations.removeMutation.mutateAsync(memberId);
        setDeleteTarget(null);
        showToast({ type: "success", message: "Membro removido da equipe." });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao remover membro.";
        setActionError(message);
        showToast({ type: "error", message });
        throw err;
      }
    },
    [mutations.removeMutation, showToast],
  );

  return {
    members,
    loading,
    refetching,
    error,
    deleteTarget,
    setDeleteTarget,
    updatingId,
    inviting: mutations.inviteMutation.isPending,
    removingId: mutations.removeMutation.isPending ? mutations.removeMutation.variables ?? null : null,
    fetchMembers: () => void membersQuery.refetch(),
    handleInvite,
    handleRoleChange,
    handleRemove,
  };
}
