/** Textos e imagens padrão da home (vitrine) quando o dono não preenche `public_profile`. */

export const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1534530005641-d1d6e66eae56?w=1920&q=80&auto=format&fit=crop";
export const DEFAULT_HERO_BADGE = "Premium Orgânico";
export const DEFAULT_HERO_TITLE = "O Sabor Autêntico da Amazônia em cada Snack";
export const DEFAULT_HERO_SUBTITLE = "Banana chips orgânicos premium, cultivados com respeito à natureza";
export const DEFAULT_HERO_CTA = "Compre Agora";

export const DEFAULT_STORY_EYEBROW = "Nossa Jornada";
export const DEFAULT_STORY_HEADING = "Nossa História";

/** Parágrafos padrão da secção história (quando `storyBody` está vazio). */
export const defaultStoryParagraphs = (displayName: string): string[] => {
  const name = displayName.trim() || "Sua Loja";
  return [
    `Na ${name}, acreditamos que a melhor forma de criar um snack saudável é respeitar a natureza desde o início. Nossos chips de banana vêm diretamente das plantações orgânicas certificadas na Amazônia.`,
    "Trabalhamos lado a lado com agricultores locais, garantindo práticas sustentáveis e comércio justo. Cada pacote que você abre é resultado de um processo cuidadoso: da colheita manual à secagem natural, tudo é feito pensando na qualidade e no meio ambiente.",
    "Do campo até sua mesa, sem intermediários, sem conservantes — apenas o sabor puro da Amazônia.",
  ];
};

export const DEFAULT_STORY_IMAGE =
  "https://images.unsplash.com/photo-1762512216852-bdd25885dbbf?w=1400&q=80&auto=format&fit=crop";
export const DEFAULT_STORY_CHIP1 = "Orgânico Certificado";
export const DEFAULT_STORY_CHIP2 = "Amazônia Brasileira";

export const DEFAULT_LIFESTYLE_EYEBROW = "Estilo de Vida";
export const DEFAULT_LIFESTYLE_SUBTITLE = "Snacks saudáveis para todos os momentos da sua vida";
export const DEFAULT_LIFESTYLE_LEFT_IMAGE =
  "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80&auto=format&fit=crop";
export const DEFAULT_LIFESTYLE_LEFT_TITLE = "Aventuras ao Ar Livre";
export const DEFAULT_LIFESTYLE_LEFT_TEXT = "O snack perfeito para suas trilhas e caminhadas";
export const DEFAULT_LIFESTYLE_RIGHT_IMAGE =
  "https://images.unsplash.com/photo-1674230326491-4e0cc329b902?w=1200&q=80&auto=format&fit=crop";
export const DEFAULT_LIFESTYLE_RIGHT_TITLE = "Momentos em Família";
export const DEFAULT_LIFESTYLE_RIGHT_TEXT =
  "No piquenique ou no camping: snacks na mochila para partilhar com a família";

export const DEFAULT_BENEFIT1_TITLE = "100% Orgânico";
export const DEFAULT_BENEFIT1_TEXT = "Certificação orgânica em todas as etapas da produção";
export const DEFAULT_BENEFIT2_TITLE = "Sem Conservantes";
export const DEFAULT_BENEFIT2_TEXT = "Apenas ingredientes naturais, nada artificial";
export const DEFAULT_BENEFIT3_TITLE = "Direto da Amazônia";
export const DEFAULT_BENEFIT3_TEXT = "Colhido e processado nas plantações certificadas";

export const DEFAULT_NEWSLETTER_EYEBROW = "Newsletter";
export const DEFAULT_NEWSLETTER_TITLE = "Fique Por Dentro";
export const DEFAULT_NEWSLETTER_SUBTITLE = "Receba novidades, receitas e ofertas exclusivas";
export const DEFAULT_NEWSLETTER_PLACEHOLDER = "Seu melhor e-mail";
export const DEFAULT_NEWSLETTER_CTA = "Inscrever-se";

/** Secção `#produtos` na home: padrão neutro: cada loja define os seus textos em Admin → Vitrine. */
export const DEFAULT_PRODUCTS_GRID_EYEBROW = "Catálogo";
export const DEFAULT_PRODUCTS_GRID_TITLE = "Nossos produtos";
export const DEFAULT_PRODUCTS_GRID_SUBTITLE =
  "Navegue pelos itens disponíveis — qualidade e variedade à sua escolha.";

/** Rodapé: quando `shipping_info` está vazio, texto neutro (evita cópia de outra vertical, ex. snacks). */
export const DEFAULT_FOOTER_SHIPPING_BLURB =
  "Conheça o catálogo e fale conosco — estamos disponíveis para esclarecer dúvidas sobre produtos e entregas.";

export const lifestyleTitleFromStore = (displayName: string) => `Momentos ${displayName}`;
