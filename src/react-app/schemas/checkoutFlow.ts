import { z } from "zod";

const phoneDigits = (value: string) => value.replace(/\D/g, "");

export const checkoutIdentitySchema = z.object({
  customerName: z.string().trim().optional(),
  customerPhone: z
    .string()
    .trim()
    .min(1, "Informe seu telefone.")
    .refine((value) => phoneDigits(value).length >= 10, "Telefone inválido."),
  deliveryAddress: z.string().trim().min(5, "Informe o endereço completo."),
  shippingCep: z
    .string()
    .trim()
    .min(1, "Informe o CEP.")
    .refine((value) => phoneDigits(value).length === 8, "CEP deve ter 8 dígitos."),
  guestEmail: z.string().trim().optional(),
});

export type CheckoutIdentityValues = z.infer<typeof checkoutIdentitySchema>;

export const checkoutPaymentSchema = z.object({
  paymentMethod: z.enum(["pix", "credit_card"], {
    required_error: "Selecione uma forma de pagamento.",
  }),
});

export type CheckoutPaymentValues = z.infer<typeof checkoutPaymentSchema>;

export function checkoutGuestEmailSchema(requireEmail: boolean) {
  if (!requireEmail) {
    return z.string().trim().optional();
  }
  return z.string().trim().min(1, "Informe seu e-mail.").email("E-mail inválido.");
}
