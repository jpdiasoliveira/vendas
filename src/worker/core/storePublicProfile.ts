/**
 * Conteúdo de store_settings.public_profile (JSONB).
 * Campos opcionais; requireLoginToCheckout ausente = true (comportamento atual).
 * Aceita objeto JSONB, string JSON, e chaves em camelCase ou snake_case.
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

function firstStr(o: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const s = str(o[k]);
    if (s) return s;
  }
  return null;
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
    return { requireLoginToCheckout: true };
  }

  const requireRaw = o.requireLoginToCheckout ?? o.require_login_to_checkout;
  let requireLoginToCheckout = true;
  if (typeof requireRaw === "boolean") {
    requireLoginToCheckout = requireRaw;
  } else if (requireRaw === "false" || requireRaw === 0) {
    requireLoginToCheckout = false;
  }

  return {
    contactPhone: firstStr(o, ["contactPhone", "contact_phone"]),
    contactWhatsapp: firstStr(o, ["contactWhatsapp", "contact_whatsapp", "whatsapp"]),
    contactEmail: firstStr(o, ["contactEmail", "contact_email"]),
    instagramUrl: firstStr(o, ["instagramUrl", "instagram_url"]),
    facebookUrl: firstStr(o, ["facebookUrl", "facebook_url"]),
    businessHours: firstStr(o, ["businessHours", "business_hours"]),
    shippingInfo: firstStr(o, ["shippingInfo", "shipping_info"]),
    deliveryPolicy: firstStr(o, ["deliveryPolicy", "delivery_policy"]),
    returnsPolicy: firstStr(o, ["returnsPolicy", "returns_policy"]),
    privacyPolicy: firstStr(o, ["privacyPolicy", "privacy_policy"]),
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
