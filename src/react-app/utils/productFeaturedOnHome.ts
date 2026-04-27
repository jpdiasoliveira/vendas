import type { Product } from "@/react-app/types";

function metadataRecord(product: Product): Record<string, unknown> | null {
  const m = product.metadata;
  if (m == null) return null;
  if (typeof m === "string") {
    try {
      const p = JSON.parse(m) as unknown;
      if (p != null && typeof p === "object" && !Array.isArray(p)) return p as Record<string, unknown>;
    } catch {
      return null;
    }
    return null;
  }
  if (typeof m === "object" && !Array.isArray(m)) return m as Record<string, unknown>;
  return null;
}

/**
 * Destaque manual na home: `products.metadata.featured_on_home` (ou camelCase no JSON).
 * Aceita metadata como objeto ou string JSON (alguns proxies/serializações).
 */
export const isProductFeaturedOnHome = (product: Product): boolean => {
  const meta = metadataRecord(product);
  if (!meta) return false;
  const raw = meta.featured_on_home ?? meta.featuredOnHome;
  if (raw === true || raw === "true" || raw === 1 || raw === "1") return true;
  return false;
};
