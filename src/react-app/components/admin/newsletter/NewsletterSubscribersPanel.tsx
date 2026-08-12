import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { NewsletterSubscriberListItem } from "@/contracts/schema";

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
};

type NewsletterSubscribersPanelProps = {
  loading: boolean;
  items: NewsletterSubscriberListItem[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function NewsletterSubscribersPanel({
  loading,
  items,
  total,
  page,
  pageSize,
  onPageChange,
}: NewsletterSubscribersPanelProps) {
  const fromIdx = total === 0 ? 0 : page * pageSize + 1;
  const toIdx = Math.min(total, (page + 1) * pageSize);
  const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" aria-label="A carregar" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-content-muted">
        Ainda não há inscrições pelo site. Quando os visitantes se inscreverem no formulário da vitrine, os e-mails
        aparecem aqui.
      </p>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-content-muted">
        A mostrar {fromIdx}–{toIdx} de {total}
      </p>
      <div className="hidden overflow-hidden rounded-2xl border border-brand-primary/10 md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-brand-primary/10 bg-brand-primary/5 font-semibold text-brand-primary">
            <tr>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Data de inscrição</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-primary/10">
            {items.map((row) => (
              <tr key={`${row.email}-${row.subscribedAt}`} className="bg-surface-elevated/80">
                <td className="px-4 py-3 font-mono text-content">{row.email}</td>
                <td className="px-4 py-3 text-content-muted">{formatDate(row.subscribedAt)}</td>
                <td className="px-4 py-3 text-content-muted">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-brand-primary/10 rounded-2xl border border-brand-primary/10 md:hidden">
        {items.map((row) => (
          <li key={`${row.email}-${row.subscribedAt}`} className="space-y-1 px-4 py-3">
            <p className="break-all font-mono text-sm font-medium text-content">{row.email}</p>
            <p className="text-xs text-content-muted">{formatDate(row.subscribedAt)}</p>
            <p className="text-xs text-content-muted">Estado: {row.status}</p>
          </li>
        ))}
      </ul>
      {lastPage > 0 ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={page <= 0}
            onClick={() => onPageChange(Math.max(0, page - 1))}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-brand-primary/20 bg-surface-elevated px-3 py-2 text-sm font-medium text-brand-primary disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
            Anterior
          </button>
          <span className="text-sm text-content-muted">
            Página {page + 1} de {lastPage + 1}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => onPageChange(Math.min(lastPage, page + 1))}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-brand-primary/20 bg-surface-elevated px-3 py-2 text-sm font-medium text-brand-primary disabled:opacity-40"
          >
            Seguinte
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      ) : null}
    </>
  );
}
