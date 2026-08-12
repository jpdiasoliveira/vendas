import type { ImageCoverFramingKind } from "@/react-app/utils/imageCoverFraming";

export const PREVIEW_W = 720;
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;

const BANNER_RATIO = 16 / 9;
const LOGO_RATIO = 1;
const BLOCK_RATIO = 4 / 3;
const PRODUCT_CARD_RATIO = 4 / 5;

export const framingRatio = (kind: ImageCoverFramingKind): number => {
  if (kind === "banner") return BANNER_RATIO;
  if (kind === "logo") return LOGO_RATIO;
  if (kind === "product") return PRODUCT_CARD_RATIO;
  return BLOCK_RATIO;
};

export const exportSize = (kind: ImageCoverFramingKind): { w: number; h: number } => {
  if (kind === "logo") return { w: 1024, h: 1024 };
  if (kind === "banner") return { w: 1920, h: 1080 };
  if (kind === "product") return { w: 1600, h: 2000 };
  return { w: 1600, h: 1200 };
};

export const framingTitle = (kind: ImageCoverFramingKind): string => {
  switch (kind) {
    case "banner":
      return "Ajustar banner (hero)";
    case "logo":
      return "Ajustar logomarca";
    case "story":
      return "Ajustar imagem — Nossa história";
    case "lifestyleLeft":
      return "Ajustar imagem — Lifestyle (esquerda)";
    case "lifestyleRight":
      return "Ajustar imagem — Lifestyle (direita)";
    case "product":
      return "Ajustar foto do produto";
  }
};

export const framingHint = (kind: ImageCoverFramingKind): string => {
  switch (kind) {
    case "banner":
      return "Área fixa 16:9 como no hero.";
    case "logo":
      return "Área fixa quadrada como no menu.";
    case "product":
      return "Área 4:5 como no cartão da vitrine.";
    default:
      return "Área fixa 4:3 como nos cartões da home.";
  }
};
