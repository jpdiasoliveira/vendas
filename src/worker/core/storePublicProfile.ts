/**
 * Conteúdo de store_settings.public_profile (JSONB).
 * Campos opcionais; requireLoginToCheckout ausente = true (comportamento atual).
 */

export type StorePublicProfile = {
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  contactEmail?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  businessHours?: string | null;
  shippingInfo?: string | null;
  deliveryPolicy?: string | null;
  returnsPolicy?: string | null;
  privacyPolicy?: string | null;
  /** Se true (padrão), exige JWT Supabase para criar pedido. Se false, permite checkout com e-mail. */
  requireLoginToCheckout?: boolean;
};

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export function parsePublicProfile(raw: unknown): StorePublicProfile {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { requireLoginToCheckout: true };
  }
  const o = raw as Record<string, unknown>;
  const requireRaw = o.requireLoginToCheckout;
  let requireLoginToCheckout = true;
  if (typeof requireRaw === "boolean") {
    requireLoginToCheckout = requireRaw;
  } else if (requireRaw === "false" || requireRaw === 0) {
    requireLoginToCheckout = false;
  }
  return {
    contactPhone: str(o.contactPhone),
    contactWhatsapp: str(o.contactWhatsapp),
    contactEmail: str(o.contactEmail),
    instagramUrl: str(o.instagramUrl),
    facebookUrl: str(o.facebookUrl),
    businessHours: str(o.businessHours),
    shippingInfo: str(o.shippingInfo),
    deliveryPolicy: str(o.deliveryPolicy),
    returnsPolicy: str(o.returnsPolicy),
    privacyPolicy: str(o.privacyPolicy),
    requireLoginToCheckout,
  };
}

/** Serializa para persistência (sem chaves undefined). */
export function toPublicProfileJson(p: StorePublicProfile): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (p.contactPhone != null) out.contactPhone = p.contactPhone;
  if (p.contactWhatsapp != null) out.contactWhatsapp = p.contactWhatsapp;
  if (p.contactEmail != null) out.contactEmail = p.contactEmail;
  if (p.instagramUrl != null) out.instagramUrl = p.instagramUrl;
  if (p.facebookUrl != null) out.facebookUrl = p.facebookUrl;
  if (p.businessHours != null) out.businessHours = p.businessHours;
  if (p.shippingInfo != null) out.shippingInfo = p.shippingInfo;
  if (p.deliveryPolicy != null) out.deliveryPolicy = p.deliveryPolicy;
  if (p.returnsPolicy != null) out.returnsPolicy = p.returnsPolicy;
  if (p.privacyPolicy != null) out.privacyPolicy = p.privacyPolicy;
  if (p.requireLoginToCheckout !== undefined) out.requireLoginToCheckout = p.requireLoginToCheckout;
  return out;
}
