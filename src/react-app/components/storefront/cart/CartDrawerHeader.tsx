import { X, ShoppingBag } from "lucide-react";

type CartDrawerHeaderProps = {
  itemCount: number;
  onClose: () => void;
};

export function CartDrawerHeader({ itemCount, onClose }: CartDrawerHeaderProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-brand-primary/10 bg-surface-elevated px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full border border-brand-primary/20 bg-accent-soft p-2">
          <ShoppingBag className="h-5 w-5 text-brand-primary" aria-hidden />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-content">Seu carrinho</h2>
          <p className="font-body text-xs text-content-muted">
            {itemCount} {itemCount === 1 ? "item" : "itens"}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/15 text-content-muted transition hover:bg-surface-muted hover:text-content"
        aria-label="Fechar carrinho"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
