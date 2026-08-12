import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/react-app/design-system/cn";
import { useMicroInteraction } from "@/react-app/hooks/storefront/useMicroInteraction";

type ButtonVariant = "primary" | "ghost" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-hover focus-visible:ring-brand-primary",
  ghost: "bg-transparent text-content hover:bg-surface-muted focus-visible:ring-brand-primary",
  outline:
    "border border-brand-primary/25 bg-surface-elevated/60 text-content backdrop-blur-sm hover:border-brand-primary/50 focus-visible:ring-brand-primary",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, className, variant = "primary", loading = false, disabled, onClick, ...rest },
  ref,
) {
  const { bindPulse } = useMicroInteraction();

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled ?? loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-body text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        className,
      )}
      onClick={(event) => {
        bindPulse(event.currentTarget);
        onClick?.(event);
      }}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : null}
      {children}
    </button>
  );
});
