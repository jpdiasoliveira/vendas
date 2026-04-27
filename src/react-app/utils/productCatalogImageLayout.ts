/**
 * Layout único das fotos de produto na vitrine (quadro 4:5 cheio, estilo azeite / barra).
 *
 * Usa `object-cover` dentro de uma moldura `inset` para preencher o 4:5 sem faixas
 * vazias em fotos horizontais; a margem interna deixa a foto um pouco menor. Pode
 * cortar um pouco as bordas da imagem (nunca o texto do card).
 *
 * Ajuste fino:
 * - `CATALOG_IMAGE_INNER_INSET`: margem da foto dentro do 4:5 (maior = imagem menor).
 * - `CATALOG_IMAGE_SCALE_HOVER`: zoom no hover.
 * Troque `object-cover` por `object-contain` se priorizar rótulo 100% vs. quadro cheio.
 */

/** Margem uniforme da foto dentro do quadro (subir ex. 8% = foto ainda menor). */
export const CATALOG_IMAGE_INNER_INSET = "inset-[6%] sm:inset-[7%]";

/** Zoom suave no hover (1 = sem zoom). */
export const CATALOG_IMAGE_SCALE_HOVER = "group-hover:scale-[1.03]";

/** Proporção do quadro de foto. */
export const CATALOG_IMAGE_ASPECT = "aspect-[4/5]";

const gradientFeatured = "bg-gradient-to-br from-[#FAF8F3] via-white to-[#FFD166]/10";
const gradientDefault = "bg-gradient-to-br from-[#FAF8F3] via-white to-[#FFD166]/5";

/** Área da foto: retângulo fixo 4:5; a imagem fica dentro da moldura `CATALOG_IMAGE_INNER_INSET`. */
export const catalogCardImageFrameClass = (isFeatured: boolean) =>
  [
    "relative w-full min-h-0 overflow-hidden",
    CATALOG_IMAGE_ASPECT,
    isFeatured ? gradientFeatured : gradientDefault,
  ].join(" ");

/** Brilho por baixo da foto (vê-se no loading ou se a imagem tiver transparência). */
export const catalogCardImageGlowClass = (isFeatured: boolean) =>
  [
    "pointer-events-none absolute right-0 top-0 z-0 rounded-full",
    isFeatured ? "h-44 w-44 bg-[#FFD166]/25 blur-3xl" : "h-36 w-36 bg-[#FFD166]/18 blur-3xl",
  ].join(" ");

/** Recorte interno: a imagem encolhe um pouco dentro do 4:5. */
export const catalogCardImageInnerClass = [
  "absolute z-10 overflow-hidden",
  CATALOG_IMAGE_INNER_INSET,
].join(" ");

export const catalogCardImageImgClass = [
  "h-full w-full object-cover object-center",
  "transition-transform duration-700 ease-out",
  CATALOG_IMAGE_SCALE_HOVER,
  "select-none",
].join(" ");

export const catalogModalImageFrameClass = () =>
  [
    "relative mb-5 w-full min-h-0 overflow-hidden rounded-2xl",
    CATALOG_IMAGE_ASPECT,
    gradientFeatured,
  ].join(" ");

export const catalogModalImageInnerClass = ["absolute z-10 overflow-hidden", CATALOG_IMAGE_INNER_INSET].join(" ");

export const catalogModalImageImgClass = ["h-full w-full object-cover object-center", "select-none"].join(" ");
