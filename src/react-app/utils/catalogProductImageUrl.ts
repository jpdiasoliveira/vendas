/**
 * URLs de produto na vitrine: pedir largura suficiente para retina + grelha (evita “borrão” ao esticar).
 * Unsplash: parâmetro `w` controla o lado maior da imagem servida.
 */

const UNSPLASH_HOSTS = new Set(["images.unsplash.com", "plus.unsplash.com"]);

function isUnsplashUrl(url: string): boolean {
  try {
    const h = new URL(url.trim()).hostname.replace(/^www\./, "");
    return UNSPLASH_HOSTS.has(h) || h.endsWith(".unsplash.com");
  } catch {
    return false;
  }
}

function tuneUnsplashUrl(url: string, width: number): string {
  const u = new URL(url.trim());
  u.searchParams.set("w", String(width));
  u.searchParams.set("q", "92");
  u.searchParams.set("auto", "format");
  if (!u.searchParams.has("fit")) u.searchParams.set("fit", "crop");
  return u.toString();
}

/** Largura única (simples) para `<img src>` quando não usamos srcset. */
export function getCatalogProductImageSrc(url: string, width = 2000): string {
  const t = url.trim();
  if (!t || !t.startsWith("http")) return t;
  if (!isUnsplashUrl(t)) return t;
  return tuneUnsplashUrl(t, width);
}

/**
 * `srcset` para o browser escolher densidade adequada (menos peso no mobile, nítido no desktop).
 */
export function getCatalogProductImageSrcSet(url: string): string | undefined {
  const t = url.trim();
  if (!t || !t.startsWith("http") || !isUnsplashUrl(t)) return undefined;
  const w640 = tuneUnsplashUrl(t, 640);
  const w960 = tuneUnsplashUrl(t, 960);
  const w1400 = tuneUnsplashUrl(t, 1400);
  const w2000 = tuneUnsplashUrl(t, 2000);
  return `${w640} 640w, ${w960} 960w, ${w1400} 1400w, ${w2000} 2000w`;
}

/** Alinhado à grelha ProductGrid: 1 → 2 → 3 → 4 colunas. */
export const CATALOG_PRODUCT_IMAGE_SIZES =
  "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 34vw, 25vw";
