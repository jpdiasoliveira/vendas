import { useMutation, useQueryClient } from "@tanstack/react-query";
import { storeMemberInviteSchema, storeMemberUpdateSchema } from "@/schemas/storeMember";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import type { StoreMemberListItem } from "@/react-app/types";
import { adminStoreMembersQueryKey } from "@/react-app/query/queryKeys";

export function useAdminStoreMemberMutations() {
  const queryClient = useQueryClient();
  const storeSlug = getEffectiveStoreSlug() || "_";
  const listKey = adminStoreMembersQueryKey(storeSlug);

  const inviteMutation = useMutation({
    mutationFn: async (payload: { email: string; full_name: string; role: "staff" | "admin" }) => {
      const body = storeMemberInviteSchema.parse(payload);
      return adminApiFetch<StoreMemberListItem>("/api/admin/members", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: "staff" | "admin" }) => {
      const body = storeMemberUpdateSchema.parse({ role });
      return adminApiFetch<StoreMemberListItem>(`/api/admin/members/${encodeURIComponent(memberId)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: listKey });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) =>
      adminApiFetch<{ id: string }>(`/api/admin/members/${encodeURIComponent(memberId)}`, { method: "DELETE" }),
    onMutate: async (memberId) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<StoreMemberListItem[]>(listKey);
      queryClient.setQueryData<StoreMemberListItem[]>(listKey, (old) =>
        (old ?? []).filter((member) => member.id !== memberId),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
    },
  });

  return { inviteMutation, updateRoleMutation, removeMutation };
}
