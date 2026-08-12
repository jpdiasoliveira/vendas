import { ShoppingBag } from "lucide-react";

export function CartEmptyState() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 rounded-full border border-brand-primary/15 bg-accent-soft p-8">
        <ShoppingBag className="h-16 w-16 text-content-muted" aria-hidden />
      </div>
      <h3 className="mb-2 font-display text-xl font-bold text-content">Seu carrinho está vazio</h3>
      <p className="font-body text-content-muted">Adicione produtos para começar</p>
    </div>
  );
}
