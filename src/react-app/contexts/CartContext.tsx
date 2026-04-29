import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

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

  // removeItem: remove uma linha do carrinho pelo id do produto.
  // useCallback([], …): mantém a mesma referência de função; assim consumidores que dependem do Context não re-renderizam só porque o Provider reexecutou.
  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((i) => i.id !== id));
  }, []);

  // clearCart: zera o estado e o armazenamento local do carrinho.
  // useCallback: função estável exposta no value memoizado abaixo.
  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (err) {
      console.error("Failed to clear cart from localStorage:", err);
    }
  }, []);

  // addItem: soma +1 na quantidade se o SKU já existir, senão cria linha com quantidade 1.
  // useCallback: evita novo identity do objeto `value` a cada render (principal fonte de re-render em Navbar/ProductCard).
  const addItem = useCallback((newItem: Omit<CartItem, "quantity">) => {
    setItems((current) => {
      const existing = current.find((i) => i.id === newItem.id);
      if (existing) {
        return current.map((i) =>
          i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...current, { ...newItem, quantity: 1 }];
    });
  }, []);

  // updateQuantity: ajusta quantidade ou delega a removeItem se for ≤ 0.
  // useCallback([removeItem]): depende só de removeItem (já estável); mantém referência fixa enquanto a lógica não mudar.
  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(id);
        return;
      }
      setItems((current) =>
        current.map((i) => (i.id === id ? { ...i, quantity } : i))
      );
    },
    [removeItem]
  );

  // total: soma preço × quantidade com regra varejo/atacado (calculateItemPrice).
  // useMemo([items]): só recalcula quando `items` muda; evita trabalho repetido e estabiliza a leitura no objeto do Provider.
  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const unitPrice = calculateItemPrice(item, item.quantity);
        return sum + unitPrice * item.quantity;
      }, 0),
    [items]
  );

  // itemCount: total de unidades no carrinho (soma das quantidades).
  // useMemo([items]): mesmo raciocínio do total — derivado puro de `items`.
  const itemCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  // value: objeto passado ao Context; sem useMemo, `{}` novo a cada render faria todos os useCart() re-renderizarem.
  // useMemo([…deps]): só recria o objeto quando alguma parte visível do carrinho ou as funções expostas mudam de referência.
  const value = useMemo<CartContextType>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      itemCount,
      calculateItemPrice,
    }),
    [items, addItem, removeItem, updateQuantity, clearCart, total, itemCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (ctx === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
