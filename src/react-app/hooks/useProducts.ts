import { useState, useEffect } from "react";
import { apiFetch } from "@/react-app/lib/api";
import type { Product } from "@/react-app/types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<Product[]>("/api/products");
        setProducts(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao carregar os produtos";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
}
