import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productCreateSchema, productUpdateSchema, type ProductCreateInput, type ProductUpdateInput } from "@/schemas/product";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import type { Product } from "@/react-app/types";
import { adminProductsQueryKey } from "@/react-app/query/queryKeys";

function patchProductList(
  products: Product[] | undefined,
  productId: string,
  patch: Partial<Product>,
): Product[] {
  if (!products) return [];
  return products.map((p) => (p.id === productId ? { ...p, ...patch } : p));
}

export function useAdminProductMutations() {
  const queryClient = useQueryClient();
  const storeSlug = getEffectiveStoreSlug() || "_";
  const listKey = adminProductsQueryKey(storeSlug);

  const createMutation = useMutation({
    mutationFn: async (payload: ProductCreateInput) => {
      const body = productCreateSchema.parse(payload);
      return adminApiFetch<Product>("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ productId, payload }: { productId: string; payload: ProductUpdateInput }) => {
      const body = productUpdateSchema.parse(payload);
      return adminApiFetch<{ id: string }>(`/api/admin/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) =>
      adminApiFetch<{ id: string }>(`/api/admin/products/${productId}`, { method: "DELETE" }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ productId, status }: { productId: string; status: "active" | "inactive" }) => {
      const body = productUpdateSchema.parse({ status });
      return adminApiFetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    onMutate: async ({ productId, status }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Product[]>(listKey);
      queryClient.setQueryData<Product[]>(listKey, (old) => patchProductList(old, productId, { status }));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });

  const toggleHomeFeaturedMutation = useMutation({
    mutationFn: async ({ productId, featured }: { productId: string; featured: boolean }) => {
      const body = productUpdateSchema.parse({ featured_on_home: featured });
      return adminApiFetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    onMutate: async ({ productId, featured }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Product[]>(listKey);
      queryClient.setQueryData<Product[]>(listKey, (old) =>
        (old ?? []).map((p) => {
          if (p.id !== productId) return p;
          const meta = { ...(p.metadata ?? {}), featured_on_home: featured };
          return { ...p, metadata: meta };
        }),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    toggleStatusMutation,
    toggleHomeFeaturedMutation,
  };
}
