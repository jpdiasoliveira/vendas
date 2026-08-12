import { RefreshCw } from "lucide-react";

type PlatformDashboardHeaderProps = {
  busy: boolean;
  onRefresh: () => void;
};

export function PlatformDashboardHeader({ busy, onRefresh }: PlatformDashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-brand-primary/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-content sm:text-3xl">Dashboard</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-content-muted">
          Visão geral do negócio: receita recorrente estimada, lojas ativas, vendas e ritmo de abertura de novas lojas.
        </p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={busy}
        className="inline-flex items-center gap-2 self-start rounded-xl border border-brand-primary/20 bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-brand-primary shadow-sm transition hover:bg-surface-muted disabled:opacity-60 sm:self-center"
      >
        <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} aria-hidden />
        Atualizar dados
      </button>
    </div>
  );
}
