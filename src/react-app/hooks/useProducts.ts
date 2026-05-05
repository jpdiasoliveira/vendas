import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/react-app/services/api";
import type { Product } from "@/react-app/types";

// [MOCK LOCAL]: Produtos de teste para exibição quando o banco estiver vazio
const MOCK_PRODUCTS: Product[] = [
  {
    id: "mock-1",
    storeId: "local-store",
    name: "Chips de Banana Salgada 50g",
    description: "Clássicos, crocantes e salgadinhos na medida certa.",
    price: 8.90,
    imageUrl:
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80&auto=format&fit=crop",
    stock: 100,
    status: "active"
  },
  {
    id: "mock-2",
    storeId: "local-store",
    name: "Chips de Banana Doce 50g",
    description: "Com um toque de canela, ideal para o lanche da tarde.",
    price: 8.90,
    imageUrl:
      "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&q=80&auto=format&fit=crop",
    stock: 50,
    status: "active"
  },
  {
    id: "mock-3",
    storeId: "local-store",
    name: "Chips de Banana Picante 50g",
    description: "Para quem gosta de uma leve picância.",
    price: 9.90,
    imageUrl:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80&auto=format&fit=crop",
    stock: 30,
    status: "active"
  }
];

/** Garante `metadata` como objeto (JSONB às vezes chega como string no parse) e `imageUrl` estável (camelCase + trim). */
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Product[]>("/api/products");

      if (Array.isArray(data) && data.length > 0) {
        setProducts(data.map(normalizeCatalogProduct));
      } else {
        console.warn("📦 [LocalDB] Nenhum produto no banco. Usando dados Mock para teste visual.");
        setProducts(MOCK_PRODUCTS);
      }

      setError(null);
    } catch (err: unknown) {
      console.error("[useProducts.fetchProducts] Falha ao carregar produtos:", err);
      setProducts(MOCK_PRODUCTS);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  /** Página restaurada do bfcache do navegador: estado antigo seria exibido sem novo GET. */
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void fetchProducts();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}
