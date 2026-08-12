import { useCallback } from "react";
import { useCart } from "@/react-app/contexts/CartContext";
import type { Product } from "@/react-app/types";

function productToCartPayload(product: Product) {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl ?? undefined,
    priceWholesale: product.priceWholesale ?? null,
    minQuantityWholesale: product.minQuantityWholesale ?? null,
    stock: product.stock ?? null,
  };
}

/** Encapsula adição ao carrinho respeitando estoque e quantidade. */
export function useProductCartActions() {
  const { items, addItem, updateQuantity } = useCart();

  const addProductToCart = useCallback(
    (product: Product, quantity: number): boolean => {
      const qty = Math.max(1, Math.floor(quantity));
      const stock = product.stock;
      if (stock != null && stock <= 0) return false;

      const existing = items.find((item) => item.id === product.id);
      const nextQty = (existing?.quantity ?? 0) + qty;

      if (stock != null && nextQty > stock) return false;

      if (!existing) {
        addItem(productToCartPayload(product));
        if (qty > 1) {
          updateQuantity(product.id, qty);
        }
      } else {
        updateQuantity(product.id, nextQty);
      }

      return true;
    },
    [items, addItem, updateQuantity],
  );

  return { addProductToCart };
}
