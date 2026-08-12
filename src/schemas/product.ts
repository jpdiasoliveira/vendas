import { z } from "zod";

const optionalImageUrl = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z.union([z.literal(""), z.string().url("URL da imagem inválida")]).optional(),
);

export const productCreateSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  price: z.number({ required_error: "Preço é obrigatório" }).positive("O preço deve ser um número positivo"),
  description: z.string().optional(),
  image_url: optionalImageUrl,
  category_id: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().uuid("ID de categoria inválido").optional(),
  ),
  stock: z.number().int().nonnegative().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
  priceWholesale: z.number().positive().nullable().optional(),
  minQuantityWholesale: z.number().int().nonnegative().nullable().optional(),
});

export const productUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    price: z.number().positive("O preço deve ser um número positivo").optional(),
    description: z.string().optional(),
    image_url: optionalImageUrl,
    priceWholesale: z.number().positive().nullable().optional(),
    minQuantityWholesale: z.number().int().nonnegative().nullable().optional(),
    stock: z.number().int().nonnegative().nullable().optional(),
    status: z.enum(["active", "inactive"]).optional(),
    featured_on_home: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Informe ao menos um campo para atualizar." });

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
