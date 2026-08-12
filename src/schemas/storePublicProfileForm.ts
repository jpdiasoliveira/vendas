import { z } from "zod";

const optionalText = z.string().max(500, "Máximo de 500 caracteres.").optional();
const optionalLongText = z.string().max(4000, "Máximo de 4000 caracteres.").optional();
const optionalUrl = z.union([z.literal(""), z.string().url("URL inválida")]).optional();
const optionalEmail = z.union([z.literal(""), z.string().email("E-mail inválido")]).optional();
const optionalHex = z.union([z.literal(""), z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida")]).optional();

export const storePublicProfileFormSchema = z.object({
  tagline: optionalText,
  heroBadge: optionalText,
  heroTitle: optionalText,
  heroSubtitle: optionalText,
  heroCtaLabel: optionalText,
  storyEyebrow: optionalText,
  storyHeading: optionalText,
  storyBody: optionalLongText,
  storyImageUrl: optionalUrl,
  storyChip1: optionalText,
  storyChip2: optionalText,
  lifestyleEyebrow: optionalText,
  lifestyleTitle: optionalText,
  lifestyleSubtitle: optionalText,
  lifestyleLeftImageUrl: optionalUrl,
  lifestyleLeftTitle: optionalText,
  lifestyleLeftText: optionalText,
  lifestyleRightImageUrl: optionalUrl,
  lifestyleRightTitle: optionalText,
  lifestyleRightText: optionalText,
  benefit1Title: optionalText,
  benefit1Text: optionalText,
  benefit2Title: optionalText,
  benefit2Text: optionalText,
  benefit3Title: optionalText,
  benefit3Text: optionalText,
  newsletterEyebrow: optionalText,
  newsletterTitle: optionalText,
  newsletterSubtitle: optionalText,
  newsletterPlaceholder: optionalText,
  newsletterCtaLabel: optionalText,
  productsGridEyebrow: optionalText,
  productsGridTitle: optionalText,
  productsGridSubtitle: optionalText,
  contactPhone: optionalText,
  contactWhatsapp: optionalText,
  contactEmail: optionalEmail,
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  businessHours: optionalText,
  shippingInfo: optionalLongText,
  shippingInfoHidden: z.boolean().optional(),
  businessHoursHidden: z.boolean().optional(),
  deliveryPolicy: optionalLongText,
  returnsPolicy: optionalLongText,
  privacyPolicy: optionalLongText,
  deliveryPolicyHidden: z.boolean().optional(),
  returnsPolicyHidden: z.boolean().optional(),
  privacyPolicyHidden: z.boolean().optional(),
  requireLoginToCheckout: z.boolean().optional(),
  logoHeightPx: z.coerce.number().int().min(20).max(100).optional().nullable(),
  logoKnockoutWhite: z.boolean().optional(),
  accentColor: optionalHex,
});

export type StorePublicProfileFormValues = z.infer<typeof storePublicProfileFormSchema>;

export const defaultStorePublicProfileFormValues: StorePublicProfileFormValues = {
  requireLoginToCheckout: true,
  logoHeightPx: null,
  logoKnockoutWhite: false,
};
