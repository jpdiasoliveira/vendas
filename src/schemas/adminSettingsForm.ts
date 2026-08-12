import { z } from "zod";
import type { StoreSettings } from "@/contracts/schema";
import { parsePublicProfile } from "@/contracts/storePublicProfile";
import { formatBrazilPhoneInput } from "@/react-app/utils/phoneBr";
import { formatBRL, parseBRL } from "@/react-app/utils/adminSettingsBrl";
import { normalizeStorePrimaryColor } from "@/react-app/utils/brandColor";
import { clampStoreLogoHeightPx } from "@/react-app/utils/storeLogoDisplay";
import {
  defaultStorePublicProfileFormValues,
  storePublicProfileFormSchema,
  type StorePublicProfileFormValues,
} from "@/schemas/storePublicProfileForm";
import { adminSettingsPatchSchema, type AdminSettingsPatchInput } from "@/schemas/adminSettings";

const hexColorField = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Informe uma cor válida (#RRGGBB).");

export const adminSettingsFormSchema = z.object({
  displayName: z.string().max(200, "Máximo de 200 caracteres."),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  primaryColor: hexColorField,
  minimumOrderValue: z.string(),
  publicProfile: storePublicProfileFormSchema,
});

export type AdminSettingsFormValues = z.infer<typeof adminSettingsFormSchema>;

export const defaultAdminSettingsFormValues: AdminSettingsFormValues = {
  displayName: "",
  logoUrl: "",
  bannerUrl: "",
  primaryColor: normalizeStorePrimaryColor(undefined),
  minimumOrderValue: "",
  publicProfile: defaultStorePublicProfileFormValues,
};

function profileToFormValues(raw: unknown): StorePublicProfileFormValues {
  const p = parsePublicProfile(raw ?? {});
  return {
    ...defaultStorePublicProfileFormValues,
    tagline: p.tagline ?? "",
    heroBadge: p.heroBadge ?? "",
    heroTitle: p.heroTitle ?? "",
    heroSubtitle: p.heroSubtitle ?? "",
    heroCtaLabel: p.heroCtaLabel ?? "",
    storyEyebrow: p.storyEyebrow ?? "",
    storyHeading: p.storyHeading ?? "",
    storyBody: p.storyBody ?? "",
    storyImageUrl: p.storyImageUrl ?? "",
    storyChip1: p.storyChip1 ?? "",
    storyChip2: p.storyChip2 ?? "",
    lifestyleEyebrow: p.lifestyleEyebrow ?? "",
    lifestyleTitle: p.lifestyleTitle ?? "",
    lifestyleSubtitle: p.lifestyleSubtitle ?? "",
    lifestyleLeftImageUrl: p.lifestyleLeftImageUrl ?? "",
    lifestyleLeftTitle: p.lifestyleLeftTitle ?? "",
    lifestyleLeftText: p.lifestyleLeftText ?? "",
    lifestyleRightImageUrl: p.lifestyleRightImageUrl ?? "",
    lifestyleRightTitle: p.lifestyleRightTitle ?? "",
    lifestyleRightText: p.lifestyleRightText ?? "",
    benefit1Title: p.benefit1Title ?? "",
    benefit1Text: p.benefit1Text ?? "",
    benefit2Title: p.benefit2Title ?? "",
    benefit2Text: p.benefit2Text ?? "",
    benefit3Title: p.benefit3Title ?? "",
    benefit3Text: p.benefit3Text ?? "",
    newsletterEyebrow: p.newsletterEyebrow ?? "",
    newsletterTitle: p.newsletterTitle ?? "",
    newsletterSubtitle: p.newsletterSubtitle ?? "",
    newsletterPlaceholder: p.newsletterPlaceholder ?? "",
    newsletterCtaLabel: p.newsletterCtaLabel ?? "",
    productsGridEyebrow: p.productsGridEyebrow ?? "",
    productsGridTitle: p.productsGridTitle ?? "",
    productsGridSubtitle: p.productsGridSubtitle ?? "",
    contactPhone: p.contactPhone ? formatBrazilPhoneInput(p.contactPhone) : "",
    contactWhatsapp: p.contactWhatsapp ? formatBrazilPhoneInput(p.contactWhatsapp) : "",
    contactEmail: p.contactEmail ?? "",
    instagramUrl: p.instagramUrl ?? "",
    facebookUrl: p.facebookUrl ?? "",
    businessHours: p.businessHours ?? "",
    shippingInfo: p.shippingInfo ?? "",
    shippingInfoHidden: p.shippingInfoHidden === true,
    businessHoursHidden: p.businessHoursHidden === true,
    deliveryPolicy: p.deliveryPolicy ?? "",
    returnsPolicy: p.returnsPolicy ?? "",
    privacyPolicy: p.privacyPolicy ?? "",
    deliveryPolicyHidden: p.deliveryPolicyHidden === true,
    returnsPolicyHidden: p.returnsPolicyHidden === true,
    privacyPolicyHidden: p.privacyPolicyHidden === true,
    requireLoginToCheckout: p.requireLoginToCheckout !== false,
    logoHeightPx: p.logoHeightPx ?? null,
    logoKnockoutWhite: p.logoKnockoutWhite === true,
    accentColor: p.accentColor ?? "",
  };
}

export function settingsToFormValues(data: StoreSettings): AdminSettingsFormValues {
  return {
    displayName: data.displayName ?? "",
    logoUrl: data.logoUrl ?? "",
    bannerUrl: data.bannerUrl ?? "",
    primaryColor: normalizeStorePrimaryColor(data.primaryColor),
    minimumOrderValue: data.minimumOrderValue != null ? formatBRL(data.minimumOrderValue) : "",
    publicProfile: profileToFormValues(data.publicProfile),
  };
}

const trimOrUndef = (v: string | undefined) => {
  const t = v?.trim();
  return t ? t : undefined;
};

const trimHomeBlockProfile = (p: StorePublicProfileFormValues) => ({
  ...p,
  heroBadge: trimOrUndef(p.heroBadge),
  heroTitle: trimOrUndef(p.heroTitle),
  heroSubtitle: trimOrUndef(p.heroSubtitle),
  heroCtaLabel: trimOrUndef(p.heroCtaLabel),
  productsGridEyebrow: trimOrUndef(p.productsGridEyebrow),
  productsGridTitle: trimOrUndef(p.productsGridTitle),
  productsGridSubtitle: trimOrUndef(p.productsGridSubtitle),
  storyEyebrow: trimOrUndef(p.storyEyebrow),
  storyHeading: trimOrUndef(p.storyHeading),
  storyBody: trimOrUndef(p.storyBody),
  storyImageUrl: trimOrUndef(p.storyImageUrl),
  storyChip1: trimOrUndef(p.storyChip1),
  storyChip2: trimOrUndef(p.storyChip2),
  lifestyleEyebrow: trimOrUndef(p.lifestyleEyebrow),
  lifestyleTitle: trimOrUndef(p.lifestyleTitle),
  lifestyleSubtitle: trimOrUndef(p.lifestyleSubtitle),
  lifestyleLeftImageUrl: trimOrUndef(p.lifestyleLeftImageUrl),
  lifestyleLeftTitle: p.lifestyleLeftTitle?.trim() ?? "",
  lifestyleLeftText: p.lifestyleLeftText?.trim() ?? "",
  lifestyleRightImageUrl: trimOrUndef(p.lifestyleRightImageUrl),
  lifestyleRightTitle: p.lifestyleRightTitle?.trim() ?? "",
  lifestyleRightText: p.lifestyleRightText?.trim() ?? "",
  benefit1Title: trimOrUndef(p.benefit1Title),
  benefit1Text: trimOrUndef(p.benefit1Text),
  benefit2Title: trimOrUndef(p.benefit2Title),
  benefit2Text: trimOrUndef(p.benefit2Text),
  benefit3Title: trimOrUndef(p.benefit3Title),
  benefit3Text: trimOrUndef(p.benefit3Text),
  newsletterEyebrow: trimOrUndef(p.newsletterEyebrow),
  newsletterTitle: trimOrUndef(p.newsletterTitle),
  newsletterSubtitle: trimOrUndef(p.newsletterSubtitle),
  newsletterPlaceholder: trimOrUndef(p.newsletterPlaceholder),
  newsletterCtaLabel: trimOrUndef(p.newsletterCtaLabel),
  contactPhone: trimOrUndef(p.contactPhone),
  contactWhatsapp: trimOrUndef(p.contactWhatsapp),
  contactEmail: trimOrUndef(p.contactEmail),
  instagramUrl: trimOrUndef(p.instagramUrl),
  facebookUrl: trimOrUndef(p.facebookUrl),
  businessHours: trimOrUndef(p.businessHours),
  shippingInfo: trimOrUndef(p.shippingInfo),
  deliveryPolicy: trimOrUndef(p.deliveryPolicy),
  returnsPolicy: trimOrUndef(p.returnsPolicy),
  privacyPolicy: trimOrUndef(p.privacyPolicy),
});

export function formValuesToPatchPayload(
  values: AdminSettingsFormValues,
  logoUrlFinal: string,
  bannerUrlFinal: string,
): AdminSettingsPatchInput {
  const p = trimHomeBlockProfile(values.publicProfile);
  const accent = p.accentColor?.trim();
  const draft = {
    displayName: values.displayName.trim() || null,
    logoUrl: logoUrlFinal.trim() || null,
    bannerUrl: bannerUrlFinal.trim() || null,
    minimumOrderValue: parseBRL(values.minimumOrderValue),
    primaryColor: values.primaryColor.trim() || null,
    publicProfile: {
      ...p,
      tagline: trimOrUndef(p.tagline),
      accentColor: accent && /^#[0-9A-Fa-f]{6}$/i.test(accent) ? accent : undefined,
      logoHeightPx: clampStoreLogoHeightPx(p.logoHeightPx ?? undefined),
      logoKnockoutWhite: p.logoKnockoutWhite === true ? true : undefined,
      requireLoginToCheckout: p.requireLoginToCheckout !== false,
      businessHoursHidden: p.businessHoursHidden ? true : undefined,
      shippingInfoHidden: p.shippingInfoHidden ? true : undefined,
      deliveryPolicyHidden: p.deliveryPolicyHidden ? true : undefined,
      returnsPolicyHidden: p.returnsPolicyHidden ? true : undefined,
      privacyPolicyHidden: p.privacyPolicyHidden ? true : undefined,
    },
  };
  return adminSettingsPatchSchema.parse(draft);
}
