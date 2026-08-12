import { useMemo } from "react";
import type { Product } from "@/react-app/types";
import { DEFAULT_CATEGORIES, isStockCritical } from "@/react-app/utils/adminProductDisplay";

export function useAdminProductsFilters(
  products: Product[],
  searchQuery: string,
  categoryFilter: string,
) {
  const categoryOptions = useMemo(() => {
    const fromData = Array.from(
      new Set(products.map((p) => p.category).filter((c): c is string => !!c?.trim())),
    ).sort();
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...fromData]));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    const byCategory = !categoryFilter.trim()
      ? products
      : products.filter((p) => (p.category ?? "").trim() === categoryFilter);
    const filtered = search
      ? byCategory.filter((p) => p.name.toLowerCase().includes(search))
      : byCategory;
    return [...filtered].sort((a, b) => {
      const aCritical = (a.stock ?? 0) <= 5 ? 0 : 1;
      const bCritical = (b.stock ?? 0) <= 5 ? 0 : 1;
      if (aCritical !== bCritical) return aCritical - bCritical;
      return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
    });
  }, [products, categoryFilter, searchQuery]);

  const criticalCount = useMemo(
    () => filteredProducts.filter((p) => isStockCritical(p.stock)).length,
    [filteredProducts],
  );

  return { categoryOptions, filteredProducts, criticalCount };
}
