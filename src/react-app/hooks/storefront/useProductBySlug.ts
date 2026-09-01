import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/react-app/services/api";
import type { Product } from "@/react-app/types";

const normalizeProduct = (raw: unknown): Product => {
  const o = raw as Record<string, unknown>;
  let metadata = o.metadata;
  if (typeof metadata === "string") {
    try {
      const p = JSON.parse(metadata) as unknown;
      metadata = p != null && typeof p === "object" && !Array.isArray(p) ? p : undefined;
    } catch {
      metadata = undefined;
    }
  }
  const rawImg = o.imageUrl ?? o.image_url;
  const imageTrim = typeof rawImg === "string" ? rawImg.trim() : "";
  const imageUrl = imageTrim === "" ? undefined : imageTrim;
  return { ...o, metadata, imageUrl } as Product;
};

export function useProductBySlug(slug: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    const trimmed = slug?.trim();
    if (!trimmed) {
      setProduct(null);
      setError("Produto não encontrado.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await apiFetch<Product>(`/api/products/by-slug/${encodeURIComponent(trimmed)}`);
      setProduct(normalizeProduct(data));
      setError(null);
    } catch (err: unknown) {
      setProduct(null);
      setError(err instanceof Error ? err.message : "Produto não encontrado.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void fetchProduct();
  }, [fetchProduct]);

  return { product, loading, error, refetch: fetchProduct };
}
