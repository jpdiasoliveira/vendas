import { z } from "zod";
import type { Category } from "@/contracts/schema";
import { categoryCreateSchema, categoryUpdateSchema, type CategoryCreateInput, type CategoryUpdateInput } from "@/schemas/category";

export const adminCategoryFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório.").max(120, "Máximo de 120 caracteres."),
  sortOrder: z.coerce.number().int().nonnegative("A ordem deve ser zero ou positiva."),
});

export type AdminCategoryFormValues = z.infer<typeof adminCategoryFormSchema>;

export const defaultAdminCategoryFormValues: AdminCategoryFormValues = {
  name: "",
  sortOrder: 0,
};

export function categoryToFormValues(category: Category): AdminCategoryFormValues {
  return {
    name: category.name,
    sortOrder: category.sortOrder ?? 0,
  };
}

export function formValuesToCreatePayload(values: AdminCategoryFormValues): CategoryCreateInput {
  return categoryCreateSchema.parse({
    name: values.name.trim(),
    sort_order: values.sortOrder,
  });
}

export function formValuesToUpdatePayload(values: AdminCategoryFormValues): CategoryUpdateInput {
  return categoryUpdateSchema.parse({
    name: values.name.trim(),
    sort_order: values.sortOrder,
  });
}
