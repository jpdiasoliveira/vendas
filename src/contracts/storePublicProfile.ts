/**
 * Conteúdo de store_settings.public_profile (JSONB).
 * Campos opcionais; requireLoginToCheckout ausente = true (comportamento atual).
 * Aceita objeto JSONB, string JSON, e chaves em camelCase ou snake_case.
 *
 * Partilhado entre Worker e Vite (contrato); o Worker não deve importar lógica de rotas daqui.
 */

export type StorePublicProfile = {
  /** Linha curta abaixo do nome da loja (navbar / rodapé). */
  tagline?: string | null;
  /** Selo acima do título na secção hero da home (ex.: «Premium Orgânico»). */
  heroBadge?: string | null;
  /** Título principal do hero na home. */
  heroTitle?: string | null;
  /** Parágrafo abaixo do título no hero. */
  heroSubtitle?: string | null;
  /** Texto do botão do hero (ex.: «Compre agora»). */
  heroCtaLabel?: string | null;
  /** Secção «Nossa História»: selo pequeno, título, corpo (parágrafos separados por linha em branco), imagem, chips. */
  storyEyebrow?: string | null;
  storyHeading?: string | null;
  storyBody?: string | null;
  storyImageUrl?: string | null;
  storyChip1?: string | null;
  storyChip2?: string | null;
  lifestyleEyebrow?: string | null;
  lifestyleTitle?: string | null;
  lifestyleSubtitle?: string | null;
  lifestyleLeftImageUrl?: string | null;
  lifestyleLeftTitle?: string | null;
  lifestyleLeftText?: string | null;
  lifestyleRightImageUrl?: string | null;
  lifestyleRightTitle?: string | null;
  lifestyleRightText?: string | null;
  benefit1Title?: string | null;
  benefit1Text?: string | null;
  benefit2Title?: string | null;
  benefit2Text?: string | null;
  benefit3Title?: string | null;
  benefit3Text?: string | null;
  newsletterEyebrow?: string | null;
  newsletterTitle?: string | null;
  newsletterSubtitle?: string | null;
  newsletterPlaceholder?: string | null;
  newsletterCtaLabel?: string | null;
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  contactEmail?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  businessHours?: string | null;
  shippingInfo?: string | null;
  /** Se true, não exibe o parágrafo de frete/regiões no rodapé (texto permanece guardado). */
  shippingInfoHidden?: boolean;
  /** Se true, não exibe o horário no rodapé. */
  businessHoursHidden?: boolean;
  deliveryPolicy?: string | null;
  returnsPolicy?: string | null;
  privacyPolicy?: string | null;
  /** Se true, oculta o bloco correspondente na loja pública. */
  deliveryPolicyHidden?: boolean;
  returnsPolicyHidden?: boolean;
  privacyPolicyHidden?: boolean;
  /** Se true (padrão), exige JWT Supabase para criar pedido. Se false, permite checkout com e-mail. */
  requireLoginToCheckout?: boolean;
  /** Altura do logo na barra da home (px), entre 20 e 100. */
  logoHeightPx?: number | null;
  /** Se true, aplica mistura no logo para atenuar fundo branco em PNGs opacos. */
  logoKnockoutWhite?: boolean | null;
  /** Cor do fim do gradiente em botões (CTA), #RRGGBB. */
  accentColor?: string | null;
};

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function firstStr(o: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const s = str(o[k]);
    if (s) return s;
  }
  return null;
}

const LOGO_H_MIN = 20;
const LOGO_H_MAX = 100;
const LOGO_H_DEFAULT = 40;

function parseLogoHeightPx(v: unknown): number {
  const raw = v ?? undefined;
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number.parseInt(String(raw).trim(), 10)
        : Number.NaN;
  if (!Number.isFinite(n)) return LOGO_H_DEFAULT;
  return Math.min(LOGO_H_MAX, Math.max(LOGO_H_MIN, Math.round(n)));
}

function parseLogoKnockoutWhite(v: unknown): boolean {
  if (v === true || v === 1) return true;
  if (typeof v === "string" && (v === "true" || v === "1")) return true;
  return false;
}

/** Só true quando explicitamente true (persistido em JSONB). Ausente = visível na loja. */
function parseHiddenFlag(v: unknown): true | undefined {
  if (v === true || v === 1) return true;
  if (typeof v === "string" && (v === "true" || v === "1")) return true;
  return undefined;
}

function normalizePublicProfileRaw(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (t === "") return null;
    try {
      const parsed = JSON.parse(t) as unknown;
      if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
    return null;
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return null;
}

export function parsePublicProfile(raw: unknown): StorePublicProfile {
  const o = normalizePublicProfileRaw(raw);
  if (!o) {
    return {
      requireLoginToCheckout: true,
      logoHeightPx: LOGO_H_DEFAULT,
      logoKnockoutWhite: false,
      accentColor: null,
    };
  }

  const requireRaw = o.requireLoginToCheckout ?? o.require_login_to_checkout;
  let requireLoginToCheckout = true;
  if (typeof requireRaw === "boolean") {
    requireLoginToCheckout = requireRaw;
  } else if (requireRaw === "false" || requireRaw === 0) {
    requireLoginToCheckout = false;
  }

  return {
    tagline: firstStr(o, ["tagline", "tag_line", "subtitle"]),
    heroBadge: firstStr(o, ["heroBadge", "hero_badge"]),
    heroTitle: firstStr(o, ["heroTitle", "hero_title"]),
    heroSubtitle: firstStr(o, ["heroSubtitle", "hero_subtitle"]),
    heroCtaLabel: firstStr(o, ["heroCtaLabel", "hero_cta_label", "hero_cta"]),
    storyEyebrow: firstStr(o, ["storyEyebrow", "story_eyebrow"]),
    storyHeading: firstStr(o, ["storyHeading", "story_heading"]),
    storyBody: firstStr(o, ["storyBody", "story_body"]),
    storyImageUrl: firstStr(o, ["storyImageUrl", "story_image_url"]),
    storyChip1: firstStr(o, ["storyChip1", "story_chip_1"]),
    storyChip2: firstStr(o, ["storyChip2", "story_chip_2"]),
    lifestyleEyebrow: firstStr(o, ["lifestyleEyebrow", "lifestyle_eyebrow"]),
    lifestyleTitle: firstStr(o, ["lifestyleTitle", "lifestyle_title"]),
    lifestyleSubtitle: firstStr(o, ["lifestyleSubtitle", "lifestyle_subtitle"]),
    lifestyleLeftImageUrl: firstStr(o, ["lifestyleLeftImageUrl", "lifestyle_left_image_url"]),
    lifestyleLeftTitle: firstStr(o, ["lifestyleLeftTitle", "lifestyle_left_title"]),
    lifestyleLeftText: firstStr(o, ["lifestyleLeftText", "lifestyle_left_text"]),
    lifestyleRightImageUrl: firstStr(o, ["lifestyleRightImageUrl", "lifestyle_right_image_url"]),
    lifestyleRightTitle: firstStr(o, ["lifestyleRightTitle", "lifestyle_right_title"]),
    lifestyleRightText: firstStr(o, ["lifestyleRightText", "lifestyle_right_text"]),
    benefit1Title: firstStr(o, ["benefit1Title", "benefit_1_title"]),
    benefit1Text: firstStr(o, ["benefit1Text", "benefit_1_text"]),
    benefit2Title: firstStr(o, ["benefit2Title", "benefit_2_title"]),
    benefit2Text: firstStr(o, ["benefit2Text", "benefit_2_text"]),
    benefit3Title: firstStr(o, ["benefit3Title", "benefit_3_title"]),
    benefit3Text: firstStr(o, ["benefit3Text", "benefit_3_text"]),
    newsletterEyebrow: firstStr(o, ["newsletterEyebrow", "newsletter_eyebrow"]),
    newsletterTitle: firstStr(o, ["newsletterTitle", "newsletter_title"]),
    newsletterSubtitle: firstStr(o, ["newsletterSubtitle", "newsletter_subtitle"]),
    newsletterPlaceholder: firstStr(o, ["newsletterPlaceholder", "newsletter_placeholder"]),
    newsletterCtaLabel: firstStr(o, ["newsletterCtaLabel", "newsletter_cta_label"]),
    contactPhone: firstStr(o, ["contactPhone", "contact_phone"]),
    contactWhatsapp: firstStr(o, ["contactWhatsapp", "contact_whatsapp", "whatsapp"]),
    contactEmail: firstStr(o, ["contactEmail", "contact_email"]),
    instagramUrl: firstStr(o, ["instagramUrl", "instagram_url"]),
    facebookUrl: firstStr(o, ["facebookUrl", "facebook_url"]),
    businessHours: firstStr(o, ["businessHours", "business_hours"]),
    shippingInfo: firstStr(o, ["shippingInfo", "shipping_info"]),
    shippingInfoHidden: parseHiddenFlag(o.shippingInfoHidden ?? o.shipping_info_hidden),
    businessHoursHidden: parseHiddenFlag(o.businessHoursHidden ?? o.business_hours_hidden),
    deliveryPolicy: firstStr(o, ["deliveryPolicy", "delivery_policy"]),
    returnsPolicy: firstStr(o, ["returnsPolicy", "returns_policy"]),
    privacyPolicy: firstStr(o, ["privacyPolicy", "privacy_policy"]),
    deliveryPolicyHidden: parseHiddenFlag(o.deliveryPolicyHidden ?? o.delivery_policy_hidden),
    returnsPolicyHidden: parseHiddenFlag(o.returnsPolicyHidden ?? o.returns_policy_hidden),
    privacyPolicyHidden: parseHiddenFlag(o.privacyPolicyHidden ?? o.privacy_policy_hidden),
    requireLoginToCheckout,
    logoHeightPx: parseLogoHeightPx(o.logoHeightPx ?? o.logo_height_px),
    logoKnockoutWhite: parseLogoKnockoutWhite(o.logoKnockoutWhite ?? o.logo_knockout_white),
    accentColor: (() => {
      const s = firstStr(o, ["accentColor", "accent_color", "buttonAccentColor", "button_accent_color"]);
      if (!s) return null;
      const t = s.startsWith("#") ? s : `#${s}`;
      return /^#[0-9A-Fa-f]{6}$/i.test(t) ? t : null;
    })(),
  };
}

/** Serializa para persistência (sem chaves undefined). */
export function toPublicProfileJson(p: StorePublicProfile): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (p.tagline != null) out.tagline = p.tagline;
  if (p.heroBadge != null) out.heroBadge = p.heroBadge;
  if (p.heroTitle != null) out.heroTitle = p.heroTitle;
  if (p.heroSubtitle != null) out.heroSubtitle = p.heroSubtitle;
  if (p.heroCtaLabel != null) out.heroCtaLabel = p.heroCtaLabel;
  if (p.storyEyebrow != null) out.storyEyebrow = p.storyEyebrow;
  if (p.storyHeading != null) out.storyHeading = p.storyHeading;
  if (p.storyBody != null) out.storyBody = p.storyBody;
  if (p.storyImageUrl != null) out.storyImageUrl = p.storyImageUrl;
  if (p.storyChip1 != null) out.storyChip1 = p.storyChip1;
  if (p.storyChip2 != null) out.storyChip2 = p.storyChip2;
  if (p.lifestyleEyebrow != null) out.lifestyleEyebrow = p.lifestyleEyebrow;
  if (p.lifestyleTitle != null) out.lifestyleTitle = p.lifestyleTitle;
  if (p.lifestyleSubtitle != null) out.lifestyleSubtitle = p.lifestyleSubtitle;
  if (p.lifestyleLeftImageUrl != null) out.lifestyleLeftImageUrl = p.lifestyleLeftImageUrl;
  if (p.lifestyleLeftTitle != null) out.lifestyleLeftTitle = p.lifestyleLeftTitle;
  if (p.lifestyleLeftText != null) out.lifestyleLeftText = p.lifestyleLeftText;
  if (p.lifestyleRightImageUrl != null) out.lifestyleRightImageUrl = p.lifestyleRightImageUrl;
  if (p.lifestyleRightTitle != null) out.lifestyleRightTitle = p.lifestyleRightTitle;
  if (p.lifestyleRightText != null) out.lifestyleRightText = p.lifestyleRightText;
  if (p.benefit1Title != null) out.benefit1Title = p.benefit1Title;
  if (p.benefit1Text != null) out.benefit1Text = p.benefit1Text;
  if (p.benefit2Title != null) out.benefit2Title = p.benefit2Title;
  if (p.benefit2Text != null) out.benefit2Text = p.benefit2Text;
  if (p.benefit3Title != null) out.benefit3Title = p.benefit3Title;
  if (p.benefit3Text != null) out.benefit3Text = p.benefit3Text;
  if (p.newsletterEyebrow != null) out.newsletterEyebrow = p.newsletterEyebrow;
  if (p.newsletterTitle != null) out.newsletterTitle = p.newsletterTitle;
  if (p.newsletterSubtitle != null) out.newsletterSubtitle = p.newsletterSubtitle;
  if (p.newsletterPlaceholder != null) out.newsletterPlaceholder = p.newsletterPlaceholder;
  if (p.newsletterCtaLabel != null) out.newsletterCtaLabel = p.newsletterCtaLabel;
  if (p.contactPhone != null) out.contactPhone = p.contactPhone;
  if (p.contactWhatsapp != null) out.contactWhatsapp = p.contactWhatsapp;
  if (p.contactEmail != null) out.contactEmail = p.contactEmail;
  if (p.instagramUrl != null) out.instagramUrl = p.instagramUrl;
  if (p.facebookUrl != null) out.facebookUrl = p.facebookUrl;
  if (p.businessHours != null) out.businessHours = p.businessHours;
  if (p.shippingInfo != null) out.shippingInfo = p.shippingInfo;
  if (p.shippingInfoHidden === true) out.shippingInfoHidden = true;
  if (p.businessHoursHidden === true) out.businessHoursHidden = true;
  if (p.deliveryPolicy != null) out.deliveryPolicy = p.deliveryPolicy;
  if (p.returnsPolicy != null) out.returnsPolicy = p.returnsPolicy;
  if (p.privacyPolicy != null) out.privacyPolicy = p.privacyPolicy;
  if (p.deliveryPolicyHidden === true) out.deliveryPolicyHidden = true;
  if (p.returnsPolicyHidden === true) out.returnsPolicyHidden = true;
  if (p.privacyPolicyHidden === true) out.privacyPolicyHidden = true;
  if (p.requireLoginToCheckout !== undefined) out.requireLoginToCheckout = p.requireLoginToCheckout;
  {
    const h =
      p.logoHeightPx != null && Number.isFinite(p.logoHeightPx)
        ? Math.min(LOGO_H_MAX, Math.max(LOGO_H_MIN, Math.round(p.logoHeightPx)))
        : LOGO_H_DEFAULT;
    out.logoHeightPx = h;
  }
  if (p.logoKnockoutWhite === true) out.logoKnockoutWhite = true;
  if (p.accentColor != null && /^#[0-9A-Fa-f]{6}$/i.test(String(p.accentColor).trim())) {
    out.accentColor = String(p.accentColor).trim().startsWith("#")
      ? String(p.accentColor).trim()
      : `#${String(p.accentColor).trim()}`;
  }
  return out;
}
