import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryCreateSchema, categoryUpdateSchema, type CategoryCreateInput, type CategoryUpdateInput } from "@/schemas/category";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import type { Category } from "@/react-app/types";
import { adminCategoriesQueryKey } from "@/react-app/query/queryKeys";

function patchCategoryList(
  categories: Category[] | undefined,
  categoryId: string,
  patch: Partial<Category>,
): Category[] {
  if (!categories) return [];
  return categories.map((c) => (c.id === categoryId ? { ...c, ...patch } : c));
}

export function useAdminCategoryMutations() {
  const queryClient = useQueryClient();
  const storeSlug = getEffectiveStoreSlug() || "_";
  const listKey = adminCategoriesQueryKey(storeSlug);

  const createMutation = useMutation({
    mutationFn: async (payload: CategoryCreateInput) => {
      const body = categoryCreateSchema.parse(payload);
      return adminApiFetch<Category>("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Category[]>(listKey);
      const optimistic: Category = {
        id: `optimistic-${crypto.randomUUID()}`,
        storeId: "",
        name: payload.name,
        sortOrder: payload.sort_order ?? 0,
      };
      queryClient.setQueryData<Category[]>(listKey, (old) => [...(old ?? []), optimistic]);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ categoryId, payload }: { categoryId: string; payload: CategoryUpdateInput }) => {
      const body = categoryUpdateSchema.parse(payload);
      return adminApiFetch<Category>(`/api/admin/categories/${encodeURIComponent(categoryId)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onMutate: async ({ categoryId, payload }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Category[]>(listKey);
      queryClient.setQueryData<Category[]>(listKey, (old) =>
        patchCategoryList(old, categoryId, {
          ...(payload.name != null ? { name: payload.name } : {}),
          ...(payload.sort_order != null ? { sortOrder: payload.sort_order } : {}),
        }),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) =>
      adminApiFetch<{ id: string }>(`/api/admin/categories/${encodeURIComponent(categoryId)}`, { method: "DELETE" }),
    onMutate: async (categoryId) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Category[]>(listKey);
      queryClient.setQueryData<Category[]>(listKey, (old) => (old ?? []).filter((c) => c.id !== categoryId));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });

  return { createMutation, updateMutation, deleteMutation };
}
