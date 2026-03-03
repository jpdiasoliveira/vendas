import { useState, useEffect } from "react";
import { apiFetch } from "@/react-app/services/api";

/**
 * Retorna a lista de product_id que estão no top de vendas (view_top_sellers).
 * Usado na vitrine (badge MAIS VENDIDO) e no admin (ícone de fogo).
 * Se a view estiver vazia, retorna [] e nenhum selo é exibido.
 */
export function useTrendingProductIds(): string[] {
  const [productIds, setProductIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<string[]>("/api/products/trending")
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setProductIds(data);
      })
      .catch(() => {
        if (!cancelled) setProductIds([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return productIds;
}
