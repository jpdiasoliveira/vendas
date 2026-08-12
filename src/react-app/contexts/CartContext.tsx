import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useToast } from "@/react-app/providers/ToastProvider";
import {
  getEffectiveStoreSlug,
  STORE_SLUG_CHANGED_EVENT,
  STORE_SLUG_OVERRIDE_STORAGE_KEY,
} from "@/react-app/services/api";

/** Dados mínimos para calcular preço por quantidade (varejo vs atacado) */
export interface PricingInfo {
  price: number;
  priceWholesale?: number | null;
  minQuantityWholesale?: number | null;
}

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
  image?: string;
  imageUrl?: string | null;
  priceWholesale?: number | null;
  minQuantityWholesale?: number | null;
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

/** Chave antiga (uma só por browser): removida após migração. */
const LEGACY_CART_STORAGE_KEY = "store-cart-items-legacy-v1";

const cartStorageKeyForSlug = (slug: string) =>
  `store-cart-v2:${slug.trim() === "" ? "__default" : slug}`;

const readCartItems = (slug: string): CartItem[] => {
  try {
    const raw = localStorage.getItem(cartStorageKeyForSlug(slug));
    if (raw) return JSON.parse(raw) as CartItem[];
  } catch {
    /* ignore */
  }
  return [];
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { showToast } = useToast();
  const legacyRemoved = useRef(false);
  const [storeSlug, setStoreSlug] = useState(() =>
    typeof window !== "undefined" ? getEffectiveStoreSlug() : ""
  );
  const [items, setItems] = useState<CartItem[]>(() =>
    typeof window !== "undefined" ? readCartItems(getEffectiveStoreSlug()) : []
  );

  useEffect(() => {
    if (legacyRemoved.current) return;
    legacyRemoved.current = true;
    try {
      localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const reloadCartForCurrentSlug = useCallback(() => {
    const slug = getEffectiveStoreSlug();
    setStoreSlug(slug);
    setItems(readCartItems(slug));
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORE_SLUG_OVERRIDE_STORAGE_KEY || e.key === null) {
        reloadCartForCurrentSlug();
      }
    };
    window.addEventListener(STORE_SLUG_CHANGED_EVENT, reloadCartForCurrentSlug);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(STORE_SLUG_CHANGED_EVENT, reloadCartForCurrentSlug);
      window.removeEventListener("storage", onStorage);
    };
  }, [reloadCartForCurrentSlug]);

  useEffect(() => {
    try {
      localStorage.setItem(cartStorageKeyForSlug(storeSlug), JSON.stringify(items));
    } catch (err) {
      showToast({
        type: "error",
        message: "Não foi possível salvar o carrinho neste navegador. Suas alterações podem se perder ao recarregar.",
      });
    }
  }, [items, storeSlug, showToast]);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

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

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const unitPrice = calculateItemPrice(item, item.quantity);
        return sum + unitPrice * item.quantity;
      }, 0),
    [items]
  );

  const itemCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

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
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (ctx === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
};
