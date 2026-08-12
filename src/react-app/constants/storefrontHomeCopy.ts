/** Textos e imagens padrão da home (vitrine) quando o dono não preenche `public_profile`. */

export const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1920&q=80&auto=format&fit=crop";
export const DEFAULT_HERO_BADGE = "Cultura & Arte";
export const DEFAULT_HERO_TITLE = "A Inspiração Perfeita para o Seu Espaço";
export const DEFAULT_HERO_SUBTITLE = "Livros que transformam e quadros artísticos que dão vida às suas paredes";
export const DEFAULT_HERO_CTA = "Compre Agora";

export const DEFAULT_STORY_EYEBROW = "Nossa Essência";
export const DEFAULT_STORY_HEADING = "Nossa História";

/** Parágrafos padrão da secção história (quando `storyBody` está vazio). */
export const defaultStoryParagraphs = (displayName: string): string[] => {
  const name = displayName.trim() || "Sua Loja";
  return [
    `Na ${name}, acreditamos que a união entre a literatura e as artes visuais tem o poder de transformar qualquer ambiente. Nossa seleção de livros e quadros artísticos é curada com paixão e dedicação.`,
    "Trabalhamos em colaboração com artistas independentes e editoras selecionadas para trazer até você peças autênticas e histórias envolventes. Cada item que você escolhe é o resultado de um olhar cuidadoso para o que há de mais belo na cultura.",
    "Da nossa galeria direto para a sua casa, oferecemos inspiração sem fronteiras — apenas arte e conhecimento puro.",
  ];
};

export const DEFAULT_STORY_IMAGE =
  "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=1400&q=80&auto=format&fit=crop";
export const DEFAULT_STORY_CHIP1 = "Arte Autêntica";
export const DEFAULT_STORY_CHIP2 = "Curadoria Literária";

export const DEFAULT_LIFESTYLE_EYEBROW = "Ambientes com Alma";
export const DEFAULT_LIFESTYLE_SUBTITLE = "Livros e quadros para inspirar cada momento do seu dia";
export const DEFAULT_LIFESTYLE_LEFT_IMAGE =
  "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=1200&q=80&auto=format&fit=crop";
export const DEFAULT_LIFESTYLE_LEFT_TITLE = "Cantinho da Leitura";
export const DEFAULT_LIFESTYLE_LEFT_TEXT = "O cenário perfeito para mergulhar em histórias inesquecíveis";
export const DEFAULT_LIFESTYLE_RIGHT_IMAGE =
  "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&q=80&auto=format&fit=crop";
export const DEFAULT_LIFESTYLE_RIGHT_TITLE = "Galeria em Casa";
export const DEFAULT_LIFESTYLE_RIGHT_TEXT =
  "Quadros que expressam a sua personalidade e decoram com estilo";

export const DEFAULT_BENEFIT1_TITLE = "Curadoria Exclusiva";
export const DEFAULT_BENEFIT1_TEXT = "Obras selecionadas cuidadosamente por especialistas";
export const DEFAULT_BENEFIT2_TITLE = "Apoio à Arte";
export const DEFAULT_BENEFIT2_TEXT = "Valorizamos e promovemos o trabalho de artistas e autores";
export const DEFAULT_BENEFIT3_TITLE = "Qualidade Premium";
export const DEFAULT_BENEFIT3_TEXT = "Impressões de alta resolução e edições literárias de excelência";

export const DEFAULT_NEWSLETTER_EYEBROW = "Clube de Cultura";
export const DEFAULT_NEWSLETTER_TITLE = "Inspire-se Conosco";
export const DEFAULT_NEWSLETTER_SUBTITLE = "Receba novidades literárias, novos artistas e ofertas exclusivas";
export const DEFAULT_NEWSLETTER_PLACEHOLDER = "Seu melhor e-mail";
export const DEFAULT_NEWSLETTER_CTA = "Inscrever-se";

/** Secção `#produtos` na home: padrão neutro: cada loja define os seus textos em Admin → Vitrine. */
export const DEFAULT_PRODUCTS_GRID_EYEBROW = "Nosso Acervo";
export const DEFAULT_PRODUCTS_GRID_TITLE = "Obras & Livros";
export const DEFAULT_PRODUCTS_GRID_SUBTITLE =
  "Navegue pelo nosso acervo — literatura e arte à sua escolha.";

/** Rodapé: quando `shipping_info` está vazio, texto neutro (evita cópia de outra vertical, ex. snacks). */
export const DEFAULT_FOOTER_SHIPPING_BLURB =
  "Explore nosso acervo e fale conosco — estamos à disposição para tirar dúvidas sobre obras, livros e entregas.";

export const lifestyleTitleFromStore = (displayName: string) => `Momentos ${displayName}`;
