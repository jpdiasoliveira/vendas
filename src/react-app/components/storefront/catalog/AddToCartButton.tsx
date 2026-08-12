import { useRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/react-app/design-system/cn";
import { useAddToCartFeedback } from "@/react-app/hooks/storefront/useAddToCartFeedback";

type AddToCartButtonProps = {
  onAdd: () => void;
  disabled?: boolean;
  className?: string;
};

export function AddToCartButton({ onAdd, disabled = false, className }: AddToCartButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { added, triggerAdded } = useAddToCartFeedback();

  return (
    <button
      ref={buttonRef}
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled || !buttonRef.current) return;
        triggerAdded(buttonRef.current);
        onAdd();
      }}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-body text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50",
        added
          ? "bg-accent text-content"
          : "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-hover",
        className,
      )}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" aria-hidden />
          Adicionado
        </>
      ) : (
        "Adicionar ao carrinho"
      )}
    </button>
  );
}
