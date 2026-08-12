import { z } from "zod";

export const storeMpPaymentFlagsSchema = z.object({
  mpAccessTokenConfigured: z.boolean(),
  mpPublicKeyConfigured: z.boolean(),
});

export type StoreMpPaymentFlags = z.infer<typeof storeMpPaymentFlagsSchema>;

export const mercadoPagoCredentialsFormSchema = z.object({
  mpAccessToken: z.string(),
  mpPublicKey: z.string(),
});

export type MercadoPagoCredentialsFormValues = z.infer<typeof mercadoPagoCredentialsFormSchema>;

export const defaultMercadoPagoCredentialsFormValues: MercadoPagoCredentialsFormValues = {
  mpAccessToken: "",
  mpPublicKey: "",
};

export const mercadoPagoPatchSchema = z.object({
  mpAccessToken: z.union([z.string().min(1), z.null()]).optional(),
  mpPublicKey: z.union([z.string().min(1), z.null()]).optional(),
});

export type MercadoPagoPatchInput = z.infer<typeof mercadoPagoPatchSchema>;

export const mercadoPagoTestSchema = z.object({
  mpAccessToken: z.string().min(1).optional(),
});

export type MercadoPagoTestInput = z.infer<typeof mercadoPagoTestSchema>;

export type MercadoPagoTestResult = {
  ok: true;
  mpUserId: number | string;
  nickname?: string | null;
};

export function buildMercadoPagoPatchPayload(
  values: MercadoPagoCredentialsFormValues,
  dirtyFields: Partial<Record<keyof MercadoPagoCredentialsFormValues, boolean>>,
): MercadoPagoPatchInput | null {
  const body: MercadoPagoPatchInput = {};
  if (dirtyFields.mpAccessToken) {
    body.mpAccessToken = values.mpAccessToken.trim() === "" ? null : values.mpAccessToken.trim();
  }
  if (dirtyFields.mpPublicKey) {
    body.mpPublicKey = values.mpPublicKey.trim() === "" ? null : values.mpPublicKey.trim();
  }
  if (body.mpAccessToken === undefined && body.mpPublicKey === undefined) return null;
  return mercadoPagoPatchSchema.parse(body);
}
