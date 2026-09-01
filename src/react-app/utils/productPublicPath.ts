/** Caminho público do produto na vitrine. */
export function getProductPublicPath(slug: string): string {
  return `/produto/${encodeURIComponent(slug.trim())}`;
}

export function productHasPublicPath(product: { slug?: string | null }): product is { slug: string } {
  return typeof product.slug === "string" && product.slug.trim().length > 0;
}
