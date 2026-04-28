import { createContext, useContext, useState, useEffect, ReactNode } from "react";

/** Dados mínimos para calcular preço por quantidade (varejo vs atacado) */
export interface PricingInfo {
  price: number;
  priceWholesale?: number | null;
  minQuantityWholesale?: number | null;
}

/**
 * Retorna o preço unitário efetivo para a quantidade dada.
 * Se quantity >= minQuantityWholesale e priceWholesale definido, usa atacado; senão varejo.
 */
export const calculateItemPrice = (
  product: PricingInfo,
  quantity: number
): number => {
  const minQty = product.minQuantityWholesale ?? Infinity;
  const wholesale = product.priceWholesale ?? null;
  if (quantity >= minQty && wholesale != null && wholesale < product.price) {
    return wholesale;
  }
  return product.price;
};

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  /** URL da imagem (pode vir da vitrine como `image` ou `imageUrl`). */
  image?: string;
  imageUrl?: string | null;
  priceWholesale?: number | null;
  minQuantityWholesale?: number | null;
  /** Estoque disponível no momento em que o item foi adicionado (usado para bloquear finalizar se insuficiente). */
  stock?: number | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  calculateItemPrice: typeof calculateItemPrice;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "mocha-cart-items";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error("Failed to save cart to localStorage:", err);
    }
  }, [items]);

  const addItem = (newItem: Omit<CartItem, "quantity">) => {
    setItems((current) => {
      const existing = current.find((i) => i.id === newItem.id);
      if (existing) {
        return current.map((i) =>
          i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...current, { ...newItem, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (err) {
      console.error("Failed to clear cart from localStorage:", err);
    }
  };

  const total = items.reduce((sum, item) => {
    const unitPrice = calculateItemPrice(item, item.quantity);
    return sum + unitPrice * item.quantity;
  }, 0);

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
        calculateItemPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (ctx === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
