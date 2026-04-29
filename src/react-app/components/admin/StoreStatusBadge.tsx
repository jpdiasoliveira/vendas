/** Estados de loja voltados ao negócio (evitar rótulos crus da base de dados na UI). */
const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-900 ring-emerald-600/30",
  trialing: "bg-cyan-100 text-cyan-950 ring-cyan-500/35",
  past_due: "bg-orange-100 text-orange-950 ring-orange-500/35",
  suspended: "bg-red-100 text-red-900 ring-red-600/30",
  archived: "bg-slate-200 text-slate-800 ring-slate-500/25",
  cancelled: "bg-slate-200 text-slate-700 ring-slate-500/25",
  draft: "bg-zinc-100 text-zinc-800 ring-zinc-500/25",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  trialing: "Período de Teste",
  past_due: "Pendência Financeira",
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
  const ring = STATUS_STYLES[key] ?? "bg-slate-100 text-slate-800 ring-slate-400/25";

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${ring}`}
    >
      {label}
    </span>
  );
};
