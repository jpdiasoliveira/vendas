import type { OrderItem } from "@/react-app/types";
import { formatCurrency } from "@/react-app/utils/format";
import { Package } from "lucide-react";

type GuestOrderItemsListProps = {
  items: OrderItem[];
};

export function GuestOrderItemsList({ items }: GuestOrderItemsListProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-content">
        <Package className="h-4 w-4" aria-hidden />
        Itens
      </p>
      <ul className="scrollbar-slim max-h-40 space-y-2 overflow-y-auto rounded-xl border border-brand-primary/10 p-3 text-sm">
        {items.map((item, idx) => (
          <li key={item.id ?? `${item.productId}-${item.productName}-${idx}`} className="flex justify-between gap-2">
            <span className="text-content-muted">
              {item.productName} × {item.quantity}
            </span>
            <span className="shrink-0 font-medium text-content">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
