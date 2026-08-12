import type { ReactNode } from "react";
import { cn } from "@/react-app/design-system/cn";

type StorefrontShellProps = {
  children: ReactNode;
  className?: string;
};

/** App shell da vitrine — fundo, tipografia e overflow controlados. */
export function StorefrontShell({ children, className }: StorefrontShellProps) {
  return (
    <div className={cn("min-h-screen overflow-x-clip text-content", className)}>
      {children}
    </div>
  );
}
