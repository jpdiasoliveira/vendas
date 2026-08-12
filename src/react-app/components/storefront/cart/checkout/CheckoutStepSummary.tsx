import { Loader2, Tag } from "lucide-react";
import { CartItemList } from "@/react-app/components/storefront/cart/CartItemList";
import { CheckoutInput } from "@/react-app/components/storefront/cart/checkout/CheckoutField";
import type { CartItem } from "@/react-app/contexts/CartContext";
import { formatCurrency } from "@/react-app/utils/format";

type CheckoutStepSummaryProps = {
  items: CartItem[];
  calculateItemPrice: (item: CartItem, quantity: number) => number;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  total: number;
  shippingFee: number;
  shippingOk: boolean;
  couponDiscount: number;
  grandTotal: number;
  minimumOrderValue: number | null;
  belowMinimum: boolean;
  hasInsufficientStock: boolean;
  couponInput: string;
  setCouponInput: (value: string) => void;
  onApplyCoupon: () => void;
  couponLoading: boolean;
  couponError: string | null;
  stepError: string | null;
  onContinue: () => void;
  onClearCart: () => void;
};

export function CheckoutStepSummary({
  items,
  calculateItemPrice,
  updateQuantity,
  removeItem,
  total,
  shippingFee,
  shippingOk,
  couponDiscount,
  grandTotal,
  minimumOrderValue,
  belowMinimum,
  hasInsufficientStock,
  couponInput,
  setCouponInput,
  onApplyCoupon,
  couponLoading,
  couponError,
  stepError,
  onContinue,
  onClearCart,
}: CheckoutStepSummaryProps) {
  return (
    <div className="space-y-4">
      <CartItemList
        items={items}
        calculateItemPrice={calculateItemPrice}
        updateQuantity={updateQuantity}
        removeItem={removeItem}
      />

      <div>
        <label className="mb-1 flex items-center gap-2 text-sm font-medium text-content-muted">
          <Tag className="h-4 w-4 shrink-0" aria-hidden />
          Cupom de desconto
        </label>
        <div className="flex gap-2">
          <CheckoutInput
            id="checkout-coupon"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="Código"
            aria-label="Código do cupom"
          />
          <button
            type="button"
            onClick={() => void onApplyCoupon()}
            disabled={couponLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-brand-primary/20 bg-surface-muted px-4 py-3 text-sm font-semibold text-content transition hover:bg-surface-elevated disabled:opacity-50"
          >
            {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Aplicar
          </button>
        </div>
        {couponError ? <p className="mt-2 text-sm text-red-400">{couponError}</p> : null}
        {couponDiscount > 0 && !couponError ? (
          <p className="mt-2 text-sm text-accent">
            Desconto: − {formatCurrency(couponDiscount)}
          </p>
        ) : null}
      </div>

      <div className="space-y-2 rounded-2xl border border-brand-primary/10 bg-surface-muted/50 p-4 font-body text-sm">
        {belowMinimum && minimumOrderValue != null ? (
          <p className="text-amber-300">Valor mínimo: {formatCurrency(minimumOrderValue)}</p>
        ) : null}
        {hasInsufficientStock ? (
          <p className="text-red-400">Estoque insuficiente em um ou mais itens.</p>
        ) : null}
        <div className="flex justify-between text-content-muted">
          <span>Subtotal</span>
          <span className="font-medium text-content">{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between text-content-muted">
          <span>Frete</span>
          <span className="font-medium text-content">
            {shippingOk ? formatCurrency(shippingFee) : "Calculado na próxima etapa"}
          </span>
        </div>
        {couponDiscount > 0 ? (
          <div className="flex justify-between text-accent">
            <span>Cupom</span>
            <span className="font-medium">− {formatCurrency(couponDiscount)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-brand-primary/10 pt-2 text-base">
          <span className="text-content-muted">Total estimado</span>
          <span className="font-display text-xl font-bold text-brand-primary">
            {formatCurrency(grandTotal)}
          </span>
        </div>
      </div>

      {stepError ? (
        <p role="alert" className="text-sm text-red-400">
          {stepError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onContinue}
        disabled={hasInsufficientStock || belowMinimum}
        className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-brand-primary py-4 font-body text-base font-bold text-white shadow-lg shadow-brand-primary/20 transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continuar
      </button>

      <button
        type="button"
        onClick={onClearCart}
        className="flex min-h-[44px] w-full items-center justify-center rounded-xl font-body text-sm font-medium text-content-muted transition hover:bg-red-500/10 hover:text-red-300"
      >
        Limpar carrinho
      </button>
    </div>
  );
}
