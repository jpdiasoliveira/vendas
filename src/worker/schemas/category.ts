import { z } from "zod";

export const categoryCreateSchema = z.object({
  name: z.string().min(1, "Informe o nome da categoria.").max(120),
  slug: z.string().max(120).optional().nullable(),
  sort_order: z.coerce.number().int().optional().nullable(),
});

export const categoryUpdateSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    slug: z.string().max(120).optional().nullable(),
    sort_order: z.coerce.number().int().optional().nullable(),
  })
  .refine((d) => d.name != null || d.slug !== undefined || d.sort_order != null, {
    message: "Informe ao menos um campo para atualizar (nome, slug ou ordem).",
  });

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
