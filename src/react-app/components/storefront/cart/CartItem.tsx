import { Minus, Plus, Tag, Trash2 } from "lucide-react";
import { ImageReveal } from "@/react-app/components/storefront/media/ImageReveal";
import { formatCurrency } from "@/react-app/utils/format";
import type { CartItem } from "@/react-app/contexts/CartContext";

type CartItemProps = {
  item: CartItem;
  unitPrice: number;
  lineTotal: number;
  isWholesale: boolean;
  savingsPerUnit: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
};

export function CartItemRow({
  item,
  unitPrice,
  lineTotal,
  isWholesale,
  savingsPerUnit,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemProps) {
  const imageSrc = item.image ?? item.imageUrl ?? "";

  return (
    <article className="rounded-2xl border border-brand-primary/10 bg-surface-elevated/90 p-4 shadow-sm backdrop-blur-sm">
      {isWholesale ? (
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent-soft px-2 py-1 font-body text-xs font-semibold text-content">
          <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Preço de atacado aplicado
        </div>
      ) : null}

      <div className="flex gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl">
          {imageSrc ? (
            <ImageReveal src={imageSrc} alt={item.name} className="h-full w-full" imgClassName="object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center bg-surface-muted font-body text-[10px] text-content-muted">
              Sem foto
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h4 className="font-body font-semibold text-content">{item.name}</h4>
              <p className="font-display text-lg font-bold text-brand-primary">
                {formatCurrency(unitPrice)}
                {isWholesale ? (
                  <span className="ml-2 font-body text-xs font-normal text-accent">
                    (economia {formatCurrency(savingsPerUnit)}/un.)
                  </span>
                ) : null}
              </p>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="shrink-0 rounded-lg p-1 text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
              aria-label={`Remover ${item.name}`}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onDecrease}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white transition hover:bg-brand-primary-hover"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-8 text-center font-body text-sm font-bold text-content">{item.quantity}</span>
            <button
              type="button"
              onClick={onIncrease}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white transition hover:bg-brand-primary-hover"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-4 w-4" />
            </button>
            <span className="ml-1 font-body text-sm text-content-muted">= {formatCurrency(lineTotal)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
