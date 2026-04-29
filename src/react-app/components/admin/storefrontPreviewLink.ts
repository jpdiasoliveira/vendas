/** Secções da mini pré-visualização da home (ligação com os campos do formulário). */

export type StorefrontPreviewSectionId =
  | "navbar"
  | "hero"
  | "story"
  | "lifestyleHead"
  | "lifestyleLeft"
  | "lifestyleRight"
  | "benefits"
  | "newsletter"
  | "footerIntro"
  | "footerContact"
  | "footerPolicies"
  | "footerEnd";

export const storefrontPreviewSectionLabels: Record<StorefrontPreviewSectionId, string> = {
  navbar: "Barra superior — logo, nome da loja, slogan e cor.",
  hero: "Topo da página — banner de fundo, selo, título, texto e botão.",
  story: "Secção «Nossa história» (texto e chips à esquerda, foto grande à direita).",
  lifestyleHead: "Linha pequena, título e subtítulo acima das duas fotos.",
  lifestyleLeft: "Cartão da esquerda — imagem e textos sobre a foto.",
  lifestyleRight: "Cartão da direita — imagem e textos sobre a foto.",
  benefits: "Faixa verde com os três benefícios.",
  newsletter: "Bloco de newsletter no final da página.",
  footerIntro: "Rodapé — texto de entrega / frete e horário de atendimento.",
  footerContact: "Rodapé — coluna «Informações» (telefone, WhatsApp, e-mail, redes).",
  footerPolicies: "Rodapé — links e textos de políticas (entrega, trocas, privacidade).",
  footerEnd:
    "Rodapé — linha final da página. Valor mínimo de pedido e «exigir login» aplicam-se ao checkout; o painel leva-te ao fim do rodapé para contexto.",
};
