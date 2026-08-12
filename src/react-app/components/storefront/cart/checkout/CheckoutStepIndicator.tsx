import type { CheckoutStep } from "@/react-app/types/checkout";

const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: "summary", label: "Resumo" },
  { key: "identity", label: "Entrega" },
  { key: "payment", label: "Pagamento" },
];

type CheckoutStepIndicatorProps = {
  current: CheckoutStep;
};

export function CheckoutStepIndicator({ current }: CheckoutStepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <nav aria-label="Etapas do checkout" className="mb-5 flex items-center gap-2">
      {STEPS.map((step, index) => {
        const active = step.key === current;
        const done = currentIndex > index;
        return (
          <div key={step.key} className="flex flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  active
                    ? "bg-brand-primary text-white"
                    : done
                      ? "bg-accent text-surface"
                      : "bg-surface-muted text-content-muted"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {index + 1}
              </span>
              <span
                className={`truncate text-[10px] font-medium uppercase tracking-wide sm:text-xs ${
                  active ? "text-brand-primary" : "text-content-muted"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <div
                className={`mb-4 h-px flex-1 ${done ? "bg-brand-primary/40" : "bg-brand-primary/10"}`}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
