import { z } from "zod";

/** CEP brasileiro: 8 dígitos → inteiro (ex.: 01310100). */
export const cepInputSchema = z
  .union([z.string(), z.number()])
  .transform((value) => {
    const digits = String(value).replace(/\D/g, "");
    if (digits.length !== 8) return null;
    const n = Number.parseInt(digits, 10);
    return Number.isFinite(n) ? n : null;
  })
  .refine((n): n is number => n !== null, { message: "CEP deve ter 8 dígitos." });

export const shippingFareBandCreateSchema = z
  .object({
    cep_from: cepInputSchema,
    cep_to: cepInputSchema,
    amount_brl: z.coerce.number().finite().nonnegative("Valor do frete deve ser zero ou positivo."),
    label: z.string().max(120).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.cep_from > data.cep_to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CEP inicial não pode ser maior que o CEP final.",
        path: ["cep_to"],
      });
    }
  });

export const shippingFareBandUpdateSchema = z
  .object({
    cep_from: cepInputSchema.optional(),
    cep_to: cepInputSchema.optional(),
    amount_brl: z.coerce.number().finite().nonnegative().optional(),
    label: z.string().max(120).optional().nullable(),
  })
  .refine((d) => d.cep_from != null || d.cep_to != null || d.amount_brl != null || d.label !== undefined, {
    message: "Informe ao menos um campo para atualizar.",
  })
  .superRefine((data, ctx) => {
    if (data.cep_from != null && data.cep_to != null && data.cep_from > data.cep_to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CEP inicial não pode ser maior que o CEP final.",
        path: ["cep_to"],
      });
    }
  });

export type ShippingFareBandCreateInput = z.infer<typeof shippingFareBandCreateSchema>;
export type ShippingFareBandUpdateInput = z.infer<typeof shippingFareBandUpdateSchema>;
