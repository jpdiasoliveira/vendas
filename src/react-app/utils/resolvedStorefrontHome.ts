import type { StorePublicProfile } from "@/contracts/storePublicProfile";
import {
  DEFAULT_BENEFIT1_TEXT,
  DEFAULT_BENEFIT1_TITLE,
  DEFAULT_BENEFIT2_TEXT,
  DEFAULT_BENEFIT2_TITLE,
  DEFAULT_BENEFIT3_TEXT,
  DEFAULT_BENEFIT3_TITLE,
  DEFAULT_LIFESTYLE_LEFT_IMAGE,
  DEFAULT_LIFESTYLE_LEFT_TEXT,
  DEFAULT_LIFESTYLE_LEFT_TITLE,
  DEFAULT_LIFESTYLE_RIGHT_IMAGE,
  DEFAULT_LIFESTYLE_RIGHT_TEXT,
  DEFAULT_LIFESTYLE_RIGHT_TITLE,
  DEFAULT_LIFESTYLE_EYEBROW,
  DEFAULT_LIFESTYLE_SUBTITLE,
  DEFAULT_NEWSLETTER_CTA,
  DEFAULT_NEWSLETTER_EYEBROW,
  DEFAULT_NEWSLETTER_PLACEHOLDER,
  DEFAULT_NEWSLETTER_SUBTITLE,
  DEFAULT_NEWSLETTER_TITLE,
  DEFAULT_PRODUCTS_GRID_EYEBROW,
  DEFAULT_PRODUCTS_GRID_SUBTITLE,
  DEFAULT_PRODUCTS_GRID_TITLE,
  DEFAULT_STORY_CHIP1,
  DEFAULT_STORY_CHIP2,
  DEFAULT_STORY_EYEBROW,
  DEFAULT_STORY_HEADING,
  DEFAULT_STORY_IMAGE,
  defaultStoryParagraphs,
  lifestyleTitleFromStore,
} from "@/react-app/constants/storefrontHomeCopy";

export type ResolvedStorefrontHome = {
  storyEyebrow: string;
  storyHeading: string;
  storyParagraphs: string[];
  storyImageUrl: string;
  storyChip1: string;
  storyChip2: string;
  lifestyleEyebrow: string;
  lifestyleTitle: string;
  lifestyleSubtitle: string;
  lifestyleLeftImageUrl: string;
  lifestyleLeftTitle: string;
  lifestyleLeftText: string;
  lifestyleRightImageUrl: string;
  lifestyleRightTitle: string;
  lifestyleRightText: string;
  benefit1Title: string;
  benefit1Text: string;
  benefit2Title: string;
  benefit2Text: string;
  benefit3Title: string;
  benefit3Text: string;
  newsletterEyebrow: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
  newsletterPlaceholder: string;
  newsletterCtaLabel: string;
  productsGridEyebrow: string;
  productsGridTitle: string;
  productsGridSubtitle: string;
};

/** Título ou texto sobre a foto: ausente/null → fallback; string (incl. `""`) → trim. */
const resolveLifestyleOverlay = (
  raw: string | null | undefined,
  fallback: string
): string => (raw === undefined || raw === null ? fallback : raw.trim());

export const resolveStorefrontHome = (
  displayName: string,
  publicProfile: StorePublicProfile | null | undefined
): ResolvedStorefrontHome => {
  const p = publicProfile;
  const name = displayName.trim() || "Sua Loja";
  const rawBody = p?.storyBody?.trim();
  const storyParagraphs = rawBody
    ? rawBody.split(/\n\n+/).map((x) => x.trim()).filter(Boolean)
    : defaultStoryParagraphs(name);

  return {
    storyEyebrow: p?.storyEyebrow?.trim() || DEFAULT_STORY_EYEBROW,
    storyHeading: p?.storyHeading?.trim() || DEFAULT_STORY_HEADING,
    storyParagraphs: storyParagraphs.length ? storyParagraphs : defaultStoryParagraphs(name),
    storyImageUrl: p?.storyImageUrl?.trim() || DEFAULT_STORY_IMAGE,
    storyChip1: p?.storyChip1?.trim() || DEFAULT_STORY_CHIP1,
    storyChip2: p?.storyChip2?.trim() || DEFAULT_STORY_CHIP2,
    lifestyleEyebrow: p?.lifestyleEyebrow?.trim() || DEFAULT_LIFESTYLE_EYEBROW,
    lifestyleTitle: p?.lifestyleTitle?.trim() || lifestyleTitleFromStore(name),
    lifestyleSubtitle: p?.lifestyleSubtitle?.trim() || DEFAULT_LIFESTYLE_SUBTITLE,
    lifestyleLeftImageUrl: p?.lifestyleLeftImageUrl?.trim() || DEFAULT_LIFESTYLE_LEFT_IMAGE,
    lifestyleLeftTitle: resolveLifestyleOverlay(p?.lifestyleLeftTitle, DEFAULT_LIFESTYLE_LEFT_TITLE),
    lifestyleLeftText: resolveLifestyleOverlay(p?.lifestyleLeftText, DEFAULT_LIFESTYLE_LEFT_TEXT),
    lifestyleRightImageUrl: p?.lifestyleRightImageUrl?.trim() || DEFAULT_LIFESTYLE_RIGHT_IMAGE,
    lifestyleRightTitle: resolveLifestyleOverlay(p?.lifestyleRightTitle, DEFAULT_LIFESTYLE_RIGHT_TITLE),
    lifestyleRightText: resolveLifestyleOverlay(p?.lifestyleRightText, DEFAULT_LIFESTYLE_RIGHT_TEXT),
    benefit1Title: p?.benefit1Title?.trim() || DEFAULT_BENEFIT1_TITLE,
    benefit1Text: p?.benefit1Text?.trim() || DEFAULT_BENEFIT1_TEXT,
    benefit2Title: p?.benefit2Title?.trim() || DEFAULT_BENEFIT2_TITLE,
    benefit2Text: p?.benefit2Text?.trim() || DEFAULT_BENEFIT2_TEXT,
    benefit3Title: p?.benefit3Title?.trim() || DEFAULT_BENEFIT3_TITLE,
    benefit3Text: p?.benefit3Text?.trim() || DEFAULT_BENEFIT3_TEXT,
    newsletterEyebrow: p?.newsletterEyebrow?.trim() || DEFAULT_NEWSLETTER_EYEBROW,
    newsletterTitle: p?.newsletterTitle?.trim() || DEFAULT_NEWSLETTER_TITLE,
    newsletterSubtitle: p?.newsletterSubtitle?.trim() || DEFAULT_NEWSLETTER_SUBTITLE,
    newsletterPlaceholder: p?.newsletterPlaceholder?.trim() || DEFAULT_NEWSLETTER_PLACEHOLDER,
    newsletterCtaLabel: p?.newsletterCtaLabel?.trim() || DEFAULT_NEWSLETTER_CTA,
    productsGridEyebrow: p?.productsGridEyebrow?.trim() || DEFAULT_PRODUCTS_GRID_EYEBROW,
    productsGridTitle: p?.productsGridTitle?.trim() || DEFAULT_PRODUCTS_GRID_TITLE,
    productsGridSubtitle: p?.productsGridSubtitle?.trim() || DEFAULT_PRODUCTS_GRID_SUBTITLE,
  };
};
