import { Download, Loader2, Mail, RefreshCw } from "lucide-react";

type NewsletterPageHeaderProps = {
  exporting: boolean;
  total: number;
  refetching: boolean;
  loading: boolean;
  onExport: () => void;
  onRefresh: () => void;
};

export function NewsletterPageHeader({
  exporting,
  total,
  refetching,
  loading,
  onExport,
  onRefresh,
}: NewsletterPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Mail className="h-9 w-9 shrink-0 text-brand-primary sm:h-10 sm:w-10" aria-hidden />
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-content sm:text-4xl">Newsletter</h1>
          <p className="mt-0.5 text-sm text-content-muted">
            Inscritos pelo formulário da vitrine (apenas esta loja).
          </p>
        </div>
      </div>
      <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:w-auto">
        <button
          type="button"
          onClick={onExport}
          disabled={exporting || total === 0}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-brand-primary/20 bg-surface-elevated px-3 py-2.5 text-sm font-medium text-content-muted shadow-sm transition-all hover:border-brand-primary/30 hover:bg-surface-muted hover:text-content disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden /> : null}
          <Download className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
          Exportar lista (CSV)
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/20 bg-surface-elevated px-3 py-2.5 text-sm font-medium text-content-muted shadow-sm transition-all hover:border-brand-primary/30 hover:bg-surface-muted hover:text-content disabled:opacity-60"
        >
          <RefreshCw className={`h-5 w-5 ${refetching ? "animate-spin" : ""}`} aria-hidden />
          Atualizar
        </button>
      </div>
    </div>
  );
}
