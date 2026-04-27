import { z } from "zod";

/** Item do carrinho na vitrine (alinhado a `CartItemPayload`). */
export const cartItemPayloadSchema = z.object({
  id: z.string().min(1, "Produto sem id."),
  name: z.string(),
  price: z.coerce.number().finite().nonnegative(),
  quantity: z.coerce.number().int().positive(),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
});

const optionalTrimmedString = z.union([z.string(), z.null()]).optional();

const rawCreateOrderBodySchema = z.object({
  items: z.array(cartItemPayloadSchema).min(1).max(100),
  customerName: optionalTrimmedString,
  customer_phone: optionalTrimmedString,
  customerPhone: optionalTrimmedString,
  delivery_address: optionalTrimmedString,
  deliveryAddress: optionalTrimmedString,
  guestEmail: optionalTrimmedString,
  guest_email: optionalTrimmedString,
  shippingPostalCode: optionalTrimmedString,
  shipping_postal_code: optionalTrimmedString,
  couponCode: optionalTrimmedString,
  coupon_code: optionalTrimmedString,
});

export const createOrderBodySchema = rawCreateOrderBodySchema
  .transform((b) => {
    const phoneTrim = String(b.customerPhone ?? b.customer_phone ?? "").trim();
    const addressTrim = String(b.deliveryAddress ?? b.delivery_address ?? "").trim();
    const cepTrim = String(b.shippingPostalCode ?? b.shipping_postal_code ?? "").trim();
    const couponCode = b.couponCode ?? b.coupon_code ?? null;
    const guestEmailRaw = String(b.guestEmail ?? b.guest_email ?? "").trim();
    return {
      items: b.items,
      customerName: b.customerName ?? null,
      customerPhone: phoneTrim,
      deliveryAddress: addressTrim,
      shippingPostalCode: cepTrim,
      couponCode,
      guestEmailRaw,
    };
  })
  .superRefine((out, ctx) => {
    if (!out.customerPhone) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Telefone é obrigatório" });
    }
    if (!out.deliveryAddress) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Endereço de entrega é obrigatório" });
    }
    if (!out.shippingPostalCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o CEP para calcular o frete.",
      });
    }
  });

export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;

export const orderPaymentBodySchema = z
  .object({
    payment_method: z.enum(["pix", "credit_card"], {
      required_error: "Forma de pagamento obrigatória.",
      invalid_type_error: "Forma de pagamento inválida ou não suportada.",
    }),
    guestEmail: optionalTrimmedString,
    guest_email: optionalTrimmedString,
  })
  .transform((b) => ({
    payment_method: b.payment_method,
    guestEmail: (b.guestEmail ?? b.guest_email ?? null) as string | null,
  }));

export type OrderPaymentBody = z.infer<typeof orderPaymentBodySchema>;

export const shippingQuoteBodySchema = z.object({
  cep: z.string().optional(),
});

export type ShippingQuoteBody = z.infer<typeof shippingQuoteBodySchema>;

export const couponValidateBodySchema = z.object({
  code: optionalTrimmedString,
  items: z
    .array(cartItemPayloadSchema)
    .min(1, "Envie os itens do carrinho para validar o cupom."),
});

export type CouponValidateBody = z.infer<typeof couponValidateBodySchema>;
