import { AnimatePresence, motion } from "motion/react";
import { CartItemRow } from "@/react-app/components/storefront/cart/CartItem";
import type { CartItem } from "@/react-app/contexts/CartContext";

type CartItemListProps = {
  items: CartItem[];
  calculateItemPrice: (item: CartItem, quantity: number) => number;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
};

export function CartItemList({
  items,
  calculateItemPrice,
  updateQuantity,
  removeItem,
}: CartItemListProps) {
  return (
    <div className="space-y-4">
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((item) => {
          const unitPrice = calculateItemPrice(item, item.quantity);
          const lineTotal = unitPrice * item.quantity;
          const isWholesale =
            item.minQuantityWholesale != null &&
            item.quantity >= item.minQuantityWholesale &&
            item.priceWholesale != null &&
            item.priceWholesale < item.price;
          const savingsPerUnit = isWholesale ? item.price - (item.priceWholesale ?? 0) : 0;

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 48, height: 0, marginBottom: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            >
              <CartItemRow
                item={item}
                unitPrice={unitPrice}
                lineTotal={lineTotal}
                isWholesale={isWholesale}
                savingsPerUnit={savingsPerUnit}
                onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                onRemove={() => removeItem(item.id)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
