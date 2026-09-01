import { useMutation, useQueryClient } from "@tanstack/react-query";
import { couponCreateSchema, couponUpdateSchema, type CouponCreateInput, type CouponUpdateInput } from "@/schemas/coupon";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import type { StoreCoupon } from "@/react-app/types";
import { adminCouponsQueryKey } from "@/react-app/query/queryKeys";

export function useAdminCouponMutations() {
  const queryClient = useQueryClient();
  const storeSlug = getEffectiveStoreSlug() || "_";
  const listKey = adminCouponsQueryKey(storeSlug);

  const createMutation = useMutation({
    mutationFn: async (payload: CouponCreateInput) => {
      const body = couponCreateSchema.parse(payload);
      return adminApiFetch<StoreCoupon>("/api/admin/coupons", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ couponId, payload }: { couponId: string; payload: CouponUpdateInput }) => {
      const body = couponUpdateSchema.parse(payload);
      return adminApiFetch<StoreCoupon>(`/api/admin/coupons/${encodeURIComponent(couponId)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: listKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (couponId: string) =>
      adminApiFetch<{ id: string }>(`/api/admin/coupons/${encodeURIComponent(couponId)}`, { method: "DELETE" }),
    onMutate: async (couponId) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<StoreCoupon[]>(listKey);
      queryClient.setQueryData<StoreCoupon[]>(listKey, (old) => (old ?? []).filter((c) => c.id !== couponId));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
  });

  return { createMutation, updateMutation, deleteMutation };
}
