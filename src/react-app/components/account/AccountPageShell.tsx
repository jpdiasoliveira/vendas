import type { ReactNode } from "react";
import { Link } from "react-router";
import { Home } from "lucide-react";

type AccountPageShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AccountPageShell({ title, subtitle, children }: AccountPageShellProps) {
  return (
    <div className="min-h-screen bg-surface px-4 pb-16 pt-10 sm:pt-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-primary/15 bg-surface-elevated text-content-muted shadow-sm transition hover:bg-surface-muted hover:text-content"
            aria-label="Voltar à loja"
          >
            <Home className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-content sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-1 font-body text-sm text-content-muted">{subtitle}</p> : null}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
