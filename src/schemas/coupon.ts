import { z } from "zod";

export const couponCreateSchema = z
  .object({
    code: z.string().trim().min(1, "Informe o código do cupom.").max(64),
    discount_type: z.enum(["percent", "fixed"], {
      required_error: "Tipo de desconto obrigatório.",
      invalid_type_error: "Tipo de desconto inválido.",
    }),
    discount_value: z.coerce.number().finite().positive("Valor do desconto deve ser maior que zero."),
    valid_from: z.string().trim().optional().nullable(),
    valid_until: z.string().trim().min(1, "Data de validade é obrigatória."),
    active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.discount_type === "percent" && data.discount_value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentual não pode ser maior que 100.",
        path: ["discount_value"],
      });
    }
  });

export const couponUpdateSchema = z
  .object({
    code: z.string().trim().min(1).max(64).optional(),
    discount_type: z.enum(["percent", "fixed"]).optional(),
    discount_value: z.coerce.number().finite().positive().optional(),
    valid_from: z.string().trim().optional().nullable(),
    valid_until: z.string().trim().min(1).optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (d) =>
      d.code != null ||
      d.discount_type != null ||
      d.discount_value != null ||
      d.valid_from !== undefined ||
      d.valid_until != null ||
      d.active != null,
    { message: "Informe ao menos um campo para atualizar." },
  )
  .superRefine((data, ctx) => {
    if (data.discount_type === "percent" && data.discount_value != null && data.discount_value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentual não pode ser maior que 100.",
        path: ["discount_value"],
      });
    }
  });

export type CouponCreateInput = z.infer<typeof couponCreateSchema>;
export type CouponUpdateInput = z.infer<typeof couponUpdateSchema>;
