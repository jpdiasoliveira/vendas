import { calculateItemPrice } from "@/react-app/contexts/CartContext";
import { formatCurrency } from "@/react-app/utils/format";
import type { Product } from "@/react-app/types";

type ProductModalPricingProps = {
  product: Product;
  quantity: number;
};

export function ProductModalPricing({ product, quantity }: ProductModalPricingProps) {
  const unitPrice = calculateItemPrice(product, quantity);
  const lineTotal = unitPrice * quantity;
  const hasWholesale =
    product.priceWholesale != null &&
    product.minQuantityWholesale != null &&
    product.minQuantityWholesale > 1;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <p className="font-display text-2xl font-bold text-brand-primary">{formatCurrency(unitPrice)}</p>
        <span className="font-body text-xs text-content-muted">/ un.</span>
      </div>
      {hasWholesale ? (
        <p className="font-body text-xs text-content-muted">
          Atacado {formatCurrency(product.priceWholesale ?? 0)} a partir de {product.minQuantityWholesale} un.
        </p>
      ) : null}
      <p className="font-body text-sm text-content">
        Subtotal: <span className="font-semibold text-content">{formatCurrency(lineTotal)}</span>
      </p>
      {product.stock != null ? (
        <p className="font-body text-xs text-content-muted">
          {product.stock > 0 ? `${product.stock} em estoque` : "Sem estoque"}
        </p>
      ) : null}
    </div>
  );
}
