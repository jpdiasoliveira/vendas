import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminOrderStatusPatchSchema,
  adminOrderTrackingPatchSchema,
  type AdminOrderStatusPatchInput,
  type AdminOrderTrackingPatchInput,
} from "@/schemas/adminOrder";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import type { Order, OrderDetail } from "@/react-app/types";
import { adminOrderDetailQueryKey, adminOrdersQueryKey } from "@/react-app/query/queryKeys";

type SyncPaymentData = {
  message: string;
  mpStatus: string;
  resultKind: string;
  outcome?: string;
  order: OrderDetail | null;
};

function patchOrderInList(orders: Order[] | undefined, orderId: string, patch: Partial<Order>): Order[] {
  if (!orders) return [];
  return orders.map((o) => (o.id === orderId ? { ...o, ...patch } : o));
}

function patchOrderDetail(
  detail: OrderDetail | undefined,
  orderId: string,
  patch: Partial<OrderDetail>,
): OrderDetail | undefined {
  if (!detail || detail.id !== orderId) return detail;
  return { ...detail, ...patch };
}

export function useAdminOrderMutations() {
  const queryClient = useQueryClient();
  const storeSlug = getEffectiveStoreSlug() || "_";
  const listKey = adminOrdersQueryKey(storeSlug);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, payload }: { orderId: string; payload: AdminOrderStatusPatchInput }) => {
      const body = adminOrderStatusPatchSchema.parse(payload);
      return adminApiFetch<{ status: string }>(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onMutate: async ({ orderId, payload }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previousList = queryClient.getQueryData<Order[]>(listKey);
      const fulfillmentOnly = payload.status === "delivered" || payload.status === "shipped";
      const listPatch: Partial<Order> = fulfillmentOnly
        ? { status: payload.status }
        : { status: payload.status, paymentStatus: payload.status };
      queryClient.setQueryData<Order[]>(listKey, (old) => patchOrderInList(old, orderId, listPatch));

      const detailKey = adminOrderDetailQueryKey(storeSlug, orderId);
      const previousDetail = queryClient.getQueryData<OrderDetail>(detailKey);
      queryClient.setQueryData<OrderDetail>(detailKey, (old) =>
        patchOrderDetail(old, orderId, {
          status: payload.status,
          paymentStatus: fulfillmentOnly ? old?.paymentStatus ?? old?.status : payload.status,
        }),
      );

      return { previousList, previousDetail, detailKey };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousList) queryClient.setQueryData(listKey, ctx.previousList);
      if (ctx?.previousDetail && ctx.detailKey) {
        queryClient.setQueryData(ctx.detailKey, ctx.previousDetail);
      }
    },
    onSettled: (_data, _err, { orderId }) => {
      void queryClient.invalidateQueries({ queryKey: listKey });
      void queryClient.invalidateQueries({ queryKey: adminOrderDetailQueryKey(storeSlug, orderId) });
    },
  });

  const updateTrackingMutation = useMutation({
    mutationFn: async ({ orderId, payload }: { orderId: string; payload: AdminOrderTrackingPatchInput }) => {
      const body = adminOrderTrackingPatchSchema.parse(payload);
      return adminApiFetch<{ ok: true }>(`/api/admin/orders/${orderId}/tracking`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onMutate: async ({ orderId, payload }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previousList = queryClient.getQueryData<Order[]>(listKey);
      const trackingPatch: Partial<Order> = {
        ...(payload.trackingCode !== undefined ? { trackingCode: payload.trackingCode } : {}),
        ...(payload.shippingMethod !== undefined ? { shippingMethod: payload.shippingMethod } : {}),
      };
      queryClient.setQueryData<Order[]>(listKey, (old) => patchOrderInList(old, orderId, trackingPatch));

      const detailKey = adminOrderDetailQueryKey(storeSlug, orderId);
      const previousDetail = queryClient.getQueryData<OrderDetail>(detailKey);
      queryClient.setQueryData<OrderDetail>(detailKey, (old) =>
        patchOrderDetail(old, orderId, trackingPatch),
      );

      return { previousList, previousDetail, detailKey };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousList) queryClient.setQueryData(listKey, ctx.previousList);
      if (ctx?.previousDetail && ctx?.detailKey) {
        queryClient.setQueryData(ctx.detailKey, ctx.previousDetail);
      }
    },
    onSettled: (_data, _err, { orderId }) => {
      void queryClient.invalidateQueries({ queryKey: listKey });
      void queryClient.invalidateQueries({ queryKey: adminOrderDetailQueryKey(storeSlug, orderId) });
    },
  });

  const syncPaymentMutation = useMutation({
    mutationFn: async (orderId: string) =>
      adminApiFetch<SyncPaymentData>(`/api/admin/orders/${orderId}/sync-payment`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: (data, orderId) => {
      if (data.order) {
        const detailKey = adminOrderDetailQueryKey(storeSlug, orderId);
        queryClient.setQueryData(detailKey, data.order);
        queryClient.setQueryData<Order[]>(listKey, (old) =>
          patchOrderInList(old, orderId, {
            status: data.order?.status,
            paymentStatus: data.order?.paymentStatus ?? data.order?.status,
          }),
        );
      }
      void queryClient.invalidateQueries({ queryKey: listKey });
      void queryClient.invalidateQueries({ queryKey: adminOrderDetailQueryKey(storeSlug, orderId) });
    },
  });

  return { updateStatusMutation, updateTrackingMutation, syncPaymentMutation };
}
