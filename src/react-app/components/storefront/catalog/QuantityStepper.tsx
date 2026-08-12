import { Minus, Plus } from "lucide-react";
import { cn } from "@/react-app/design-system/cn";

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  max?: number | null;
  className?: string;
};

export function QuantityStepper({ value, onChange, max, className }: QuantityStepperProps) {
  const atMin = value <= 1;
  const atMax = max != null && value >= max;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-brand-primary/20 bg-surface-muted p-1",
        className,
      )}
    >
      <button
        type="button"
        disabled={atMin}
        onClick={() => onChange(Math.max(1, value - 1))}
        className="rounded-full p-2 text-content-muted transition hover:bg-surface-elevated hover:text-content disabled:opacity-40"
        aria-label="Diminuir quantidade"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-10 text-center font-body text-sm font-semibold text-content">{value}</span>
      <button
        type="button"
        disabled={atMax}
        onClick={() => onChange(max != null ? Math.min(max, value + 1) : value + 1)}
        className="rounded-full p-2 text-content-muted transition hover:bg-surface-elevated hover:text-content disabled:opacity-40"
        aria-label="Aumentar quantidade"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
