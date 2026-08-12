import { useCallback, useMemo, useState } from "react";
import type { Product } from "@/react-app/types";

export function useCatalogSection(products: readonly Product[]) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const visibleProducts = useMemo(
    () => products.filter((product) => product.status !== "inactive"),
    [products],
  );

  const openProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const closeProduct = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  return {
    visibleProducts,
    selectedProduct,
    isModalOpen: selectedProduct !== null,
    openProduct,
    closeProduct,
  };
}
