import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/react-app/providers/ToastProvider";
import { apiFetch } from "@/react-app/services/api";
import type { Product } from "@/react-app/types";

/** Garante `metadata` como objeto e `imageUrl` estável (camelCase + trim). */
const normalizeCatalogProduct = (raw: unknown): Product => {
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

export function useProducts() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Product[]>("/api/products");
      setProducts(Array.isArray(data) ? data.map(normalizeCatalogProduct) : []);
      setError(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Não foi possível carregar os produtos da loja.";
      setProducts([]);
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void fetchProducts();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}
