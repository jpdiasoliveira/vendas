/** Estados de loja voltados ao negócio (evitar rótulos crus da base de dados na UI). */
const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  trialing: "bg-cyan-500/15 text-cyan-200 ring-cyan-500/30",
  past_due: "bg-orange-500/15 text-orange-200 ring-orange-500/30",
  suspended: "bg-red-500/15 text-red-300 ring-red-500/30",
  archived: "bg-surface-muted text-content-muted ring-brand-primary/20",
  cancelled: "bg-surface-muted text-content-muted ring-brand-primary/15",
  draft: "bg-surface-elevated text-content-muted ring-brand-primary/15",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  trialing: "Em Teste",
  past_due: "Aguardando Pagamento",
  suspended: "Suspensa",
  archived: "Arquivada",
  cancelled: "Encerrada",
  draft: "Rascunho",
};

const formatUnknown = (raw: string) =>
  raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

type StoreStatusBadgeProps = {
  status?: string | null;
};

export const StoreStatusBadge = ({ status }: StoreStatusBadgeProps) => {
  const raw = String(status ?? "").trim();
  const key = raw.toLowerCase();
  const label = STATUS_LABELS[key] ?? (raw ? formatUnknown(raw) : "Sem estado");
  const ring = STATUS_STYLES[key] ?? "bg-surface-muted text-content ring-brand-primary/20";

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${ring}`}
    >
      {label}
    </span>
  );
};
