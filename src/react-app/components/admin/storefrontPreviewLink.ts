/** Secções da mini pré-visualização da home (ligação com os campos do formulário). */

/** Prefixo único para IDs na pré-visualização admin (scroll sync, inspeção, aria-controls). */
export const ADMIN_STOREFRONT_PREVIEW_ID_PREFIX = "admin-storefront-preview";

/** DOM id estável na mini pré-visualização (ex.: `admin-storefront-preview-hero`). */
export const adminStorefrontPreviewSectionId = (section: string): string =>
  `${ADMIN_STOREFRONT_PREVIEW_ID_PREFIX}-${section}`;

/** Alvos de scroll no texto longo das políticas (admin); existem no DOM mesmo com campos vazios. */
export const PREVIEW_POLITICA_ENTREGA_ID = "preview-politica-entrega";
export const PREVIEW_POLITICA_TROCAS_ID = "preview-politica-trocas";
export const PREVIEW_POLITICA_PRIVACIDADE_ID = "preview-politica-privacidade";

/** Cartões «estilo de vida» na pré-visualização admin — alinhar scroll ao texto sobre a foto, não ao topo da secção. */
export const PREVIEW_LIFESTYLE_LEFT_CAPTION_ID = "preview-lifestyle-left-caption";
export const PREVIEW_LIFESTYLE_RIGHT_CAPTION_ID = "preview-lifestyle-right-caption";

/**
 * ID do nó alvo para scroll sync (vários campos do formulário → um bloco na pré-visualização).
 */
export const adminPreviewScrollTargetId = (section: StorefrontPreviewSectionId): string => {
  if (section === "lifestyleLeft") return PREVIEW_LIFESTYLE_LEFT_CAPTION_ID;
  if (section === "lifestyleRight") return PREVIEW_LIFESTYLE_RIGHT_CAPTION_ID;
  if (section === "lifestyleHead") {
    return adminStorefrontPreviewSectionId("lifestyle");
  }
  if (section === "footerPolicyDelivery") return PREVIEW_POLITICA_ENTREGA_ID;
  if (section === "footerPolicyReturns") return PREVIEW_POLITICA_TROCAS_ID;
  if (section === "footerPolicyPrivacy") return PREVIEW_POLITICA_PRIVACIDADE_ID;
  if (section === "footerPolicies") {
    return adminStorefrontPreviewSectionId("footerPoliciesBody");
  }
  return adminStorefrontPreviewSectionId(section);
};

export type StorefrontPreviewSectionId =
  | "navbar"
  | "hero"
  | "products"
  | "story"
  /** Envolve cabeçalho + cartões na pré-visualização admin (id DOM `…-lifestyle`). */
  | "lifestyle"
  | "lifestyleHead"
  | "lifestyleLeft"
  | "lifestyleRight"
  | "benefits"
  | "newsletter"
  | "footerIntro"
  | "footerContact"
  | "footerPolicies"
  | "footerPolicyDelivery"
  | "footerPolicyReturns"
  | "footerPolicyPrivacy";

/** Primeiro campo editável do formulário (id HTML) para cada secção da pré-visualização — navegação inversa. */
export const formFieldIdForPreviewSection = (section: StorefrontPreviewSectionId): string => {
  const m: Record<StorefrontPreviewSectionId, string> = {
    navbar: "displayName",
    hero: "heroBadge",
    products: "productsGridEyebrow",
    story: "storyEyebrow",
    lifestyle: "lifestyleEyebrow",
    lifestyleHead: "lifestyleEyebrow",
    lifestyleLeft: "admin-form-url-lifestyleLeftImageUrl",
    lifestyleRight: "admin-form-url-lifestyleRightImageUrl",
    benefits: "benefit1Title",
    newsletter: "newsletterEyebrow",
    footerIntro: "footerBusinessHours",
    footerContact: "footerContactWhatsapp",
    footerPolicies: "footerDeliveryPolicy",
    footerPolicyDelivery: "footerDeliveryPolicy",
    footerPolicyReturns: "footerReturnsPolicy",
    footerPolicyPrivacy: "footerPrivacyPolicy",
  };
  return m[section];
};

/** Rola o formulário admin até o campo e foca (input/textarea/select). */
export const scrollAdminFormToFieldId = (fieldId: string): void => {
  const el = document.getElementById(fieldId);
  if (!el?.isConnected) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });

  let focusEl: HTMLElement | null = null;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    if (el instanceof HTMLInputElement && (el.type === "hidden" || el.classList.contains("sr-only"))) {
      focusEl = el.parentElement?.querySelector<HTMLElement>("input:not(.sr-only), textarea, select") ?? null;
    } else {
      focusEl = el;
    }
  } else {
    focusEl = el.querySelector<HTMLElement>("input:not(.sr-only):not([type=hidden]), textarea, select, button");
  }

  window.requestAnimationFrame(() => {
    try {
      focusEl?.focus({ preventScroll: true });
    } catch {
      /* ignore */
    }
  });
};

export const storefrontPreviewSectionLabels: Record<StorefrontPreviewSectionId, string> = {
  navbar: "Barra superior — logo, nome da loja, slogan e cor.",
  hero: "Topo da página — banner de fundo, selo, título, texto e botão.",
  products: "Secção de produtos — selo, título e subtítulo acima da grelha (cartões são exemplo).",
  story: "Secção «Nossa história» (texto e chips à esquerda, foto grande à direita).",
  lifestyle: "Secção «momentos / estilo de vida» — cabeçalho e duas fotos.",
  lifestyleHead: "Linha pequena, título e subtítulo acima das duas fotos.",
  lifestyleLeft: "Cartão da esquerda — imagem e textos sobre a foto.",
  lifestyleRight: "Cartão da direita — imagem e textos sobre a foto.",
  benefits: "Faixa verde com os três benefícios.",
  newsletter: "Bloco de newsletter no final da página.",
  footerIntro: "Rodapé — texto de entrega / frete e horário de atendimento.",
  footerContact: "Rodapé — coluna «Informações» (telefone, WhatsApp, e-mail, redes).",
  footerPolicies: "Rodapé — links e textos de políticas (entrega, trocas, privacidade).",
  footerPolicyDelivery: "Rodapé — política de entrega (texto longo).",
  footerPolicyReturns: "Rodapé — trocas e devoluções (texto longo).",
  footerPolicyPrivacy: "Rodapé — privacidade / LGPD (texto longo).",
};
