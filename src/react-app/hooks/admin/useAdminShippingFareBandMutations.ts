import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shippingFareBandCreateSchema, shippingFareBandUpdateSchema, type ShippingFareBandCreateInput, type ShippingFareBandUpdateInput } from "@/schemas/shippingFareBand";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import type { ShippingFareBand } from "@/react-app/types";
import { adminShippingFareBandsQueryKey } from "@/react-app/query/queryKeys";

export function useAdminShippingFareBandMutations() {
  const queryClient = useQueryClient();
  const storeSlug = getEffectiveStoreSlug() || "_";
  const listKey = adminShippingFareBandsQueryKey(storeSlug);

  const createMutation = useMutation({
    mutationFn: async (payload: ShippingFareBandCreateInput) => {
      const body = shippingFareBandCreateSchema.parse(payload);
      return adminApiFetch<ShippingFareBand>("/api/admin/shipping-fare-bands", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "shipping-fare-bands"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ bandId, payload }: { bandId: string; payload: ShippingFareBandUpdateInput }) => {
      const body = shippingFareBandUpdateSchema.parse(payload);
      return adminApiFetch<ShippingFareBand>(`/api/admin/shipping-fare-bands/${encodeURIComponent(bandId)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: listKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (bandId: string) =>
      adminApiFetch<{ id: string }>(`/api/admin/shipping-fare-bands/${encodeURIComponent(bandId)}`, {
        method: "DELETE",
      }),
    onMutate: async (bandId) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<ShippingFareBand[]>(listKey);
      queryClient.setQueryData<ShippingFareBand[]>(listKey, (old) => (old ?? []).filter((b) => b.id !== bandId));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "shipping-fare-bands"] });
    },
  });

  return { createMutation, updateMutation, deleteMutation };
}
