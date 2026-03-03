import { useState, useEffect } from "react";
import { apiFetch } from "@/react-app/services/api";
import type { Product } from "@/react-app/types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Carrega a lista de produtos da loja ao montar. */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<Product[]>("/api/products");
        setProducts(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao carregar os produtos";
        console.error("[useProducts.fetchProducts] Falha ao carregar produtos:", err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
}
