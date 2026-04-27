import { Plus, Minus, Trash2, Tag } from "lucide-react";
import type { CartItem } from "@/react-app/contexts/CartContext";

type CartModalLineItemsProps = {
  items: CartItem[];
  calculateItemPrice: (item: CartItem, quantity: number) => number;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
};

export const CartModalLineItems = ({
  items,
  calculateItemPrice,
  updateQuantity,
  removeItem,
}: CartModalLineItemsProps) => (
  <div className="space-y-4">
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
        <div
          key={item.id}
          className="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:shadow-xl"
        >
          {isWholesale && (
            <div className="mb-2 flex w-fit items-center gap-1.5 rounded-lg border border-[#FFD166]/40 bg-[#FFD166]/20 px-2 py-1 font-inter text-xs font-semibold text-[#1B4332]">
              <Tag className="h-3.5 w-3.5 shrink-0" />
              Preço de Atacado Aplicado!
            </div>
          )}
          <div className="flex gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#FAF8F3] to-[#FFD166]/10">
              <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-playfair font-bold text-[#1B4332]">{item.name}</h4>
                  <p className="font-playfair text-lg font-bold text-[#1B4332]">
                    R$ {unitPrice.toFixed(2)}
                    {isWholesale && (
                      <span className="ml-2 font-inter text-sm font-normal text-green-700">
                        (economia de R$ {savingsPerUnit.toFixed(2)}/un.)
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 rounded-lg p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] text-white transition-transform hover:shadow-lg active:scale-95"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <span className="min-w-[2rem] text-center font-inter text-base font-bold text-[#1B4332]">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] text-white transition-transform hover:shadow-lg active:scale-95"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <span className="ml-1 font-inter text-sm text-[#6D4C41]">= R$ {lineTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);
