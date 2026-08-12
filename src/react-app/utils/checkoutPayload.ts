import type { CartItem } from "@/react-app/contexts/CartContext";

/** Payload de linha exigido pelo schema público — preço validado no servidor. */
export type CheckoutApiLine = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  imageUrl?: string;
};

export function buildCheckoutApiLines(
  items: CartItem[],
  unitPriceFor: (item: CartItem, quantity: number) => number,
): CheckoutApiLine[] {
  return items.map((item) => {
    const img = item.image ?? item.imageUrl ?? undefined;
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: unitPriceFor(item, item.quantity),
      ...(img ? { image: img, imageUrl: img } : {}),
    };
  });
}
