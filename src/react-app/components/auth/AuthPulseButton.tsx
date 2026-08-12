import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/react-app/design-system/cn";
import { useMicroInteraction } from "@/react-app/hooks/storefront/useMicroInteraction";

type AuthPulseButtonVariant = "primary" | "outline";

type AuthPulseButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
  variant?: AuthPulseButtonVariant;
};

const variantClass: Record<AuthPulseButtonVariant, string> = {
  primary:
    "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-hover focus-visible:ring-brand-primary",
  outline:
    "border border-brand-primary/25 bg-surface-elevated text-content hover:border-brand-primary/50 hover:bg-surface-muted focus-visible:ring-brand-primary",
};

export const AuthPulseButton = forwardRef<HTMLButtonElement, AuthPulseButtonProps>(
  function AuthPulseButton(
    { children, className, loading = false, disabled, variant = "primary", onClick, type = "button", ...rest },
    ref,
  ) {
    const { bindPulse } = useMicroInteraction();

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled ?? loading}
        className={cn(
          "inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-body text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50",
          variantClass[variant],
          className,
        )}
        onClick={(event) => {
          if (!loading && !disabled) bindPulse(event.currentTarget);
          onClick?.(event);
        }}
        {...rest}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
        {children}
      </button>
    );
  },
);
