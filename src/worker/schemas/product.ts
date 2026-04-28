import { z } from "zod";

/**
 * Schema de validação para produto (POST/PUT).
 * Campos: id, title, price (number), description, image_url.
 * Mensagens em português para erros 400.
 */

const msg = {
  required: "Campo obrigatório",
  pricePositive: "O preço deve ser um número positivo",
  url: "URL da imagem inválida",
} as const;

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Título é obrigatório"),
  price: z.number({ required_error: "Preço é obrigatório" }).positive(msg.pricePositive),
  description: z.string().optional(),
  image_url: z.string().url(msg.url).optional().or(z.literal("")),
});

/** Body para criar produto (POST): title e price obrigatórios; atacado e estoque opcionais. */
export const productCreateSchema = productSchema
  .omit({ id: true })
  .extend({
    category_id: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : val),
      z.string().uuid("ID de categoria inválido").optional()
    ),
    stock: z.number().int().nonnegative().optional().nullable(),
    status: z.enum(["active", "inactive"]).optional(),
    image_url: z.string().url(msg.url).optional().or(z.literal("")).optional(),
    priceWholesale: z.number().positive().nullable().optional(),
    minQuantityWholesale: z.number().int().nonnegative().nullable().optional(),
  });

/** Body para atualizar produto (PUT): todos os campos opcionais. Inclui campos extras do admin (priceWholesale, stock). */
export const productUpdateSchema = productSchema
  .partial()
  .extend({
    price: z.number().positive(msg.pricePositive).optional(),
    image_url: z.string().url(msg.url).optional().or(z.literal("")).optional(),
    priceWholesale: z.number().positive().nullable().optional(),
    minQuantityWholesale: z.number().int().nonnegative().nullable().optional(),
    stock: z.number().int().nonnegative().nullable().optional(),
    status: z.enum(["active", "inactive"]).optional(),
    /** Destaque na tela inicial (persistido em products.metadata.featured_on_home). */
    featured_on_home: z.boolean().optional(),
  });

export type ProductSchema = z.infer<typeof productSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
