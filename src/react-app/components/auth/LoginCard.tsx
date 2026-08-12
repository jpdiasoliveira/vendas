import type { ReactNode } from "react";

type LoginCardProps = {
  children: ReactNode;
};

export function LoginCard({ children }: LoginCardProps) {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-brand-primary/15 bg-surface-elevated/90 p-8 shadow-2xl backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}
