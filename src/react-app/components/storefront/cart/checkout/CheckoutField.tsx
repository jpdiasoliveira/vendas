import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";

type CheckoutFieldProps = {
  id: string;
  label: React.ReactNode;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function CheckoutField({ id, label, error, required, children }: CheckoutFieldProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!error || !wrapRef.current) return;
    animate(wrapRef.current, {
      translateX: [0, -6, 6, -4, 4, 0],
      duration: 420,
      ease: "out(3)",
    });
  }, [error]);

  return (
    <div ref={wrapRef}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-content-muted">
        {label}
        {required ? <span className="text-red-400"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type CheckoutInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export function CheckoutInput({ hasError, className, ...props }: CheckoutInputProps) {
  return (
    <input
      {...props}
      className={`${storefrontInputClass} ${hasError ? "border-red-500/50 focus:border-red-400 focus:ring-red-400/30" : ""} ${className ?? ""}`}
      aria-invalid={hasError || undefined}
    />
  );
}
