import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Home,
  Loader2,
  Mail,
  RefreshCw,
} from "lucide-react";
import { downloadAdminNewsletterSubscribersCsv } from "@/react-app/services/api";
import {
  NEWSLETTER_ADMIN_PAGE_SIZE,
  useAdminNewsletterSubscribersQuery,
} from "@/react-app/hooks/useAdminNewsletterSubscribersQuery";

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
};

const AdminNewsletterPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const listQuery = useAdminNewsletterSubscribersQuery({ page });
  const data = listQuery.data;
  const loading = listQuery.isPending && listQuery.data === undefined;
  const loadError =
    listQuery.isError && listQuery.error instanceof Error
      ? listQuery.error.message
      : listQuery.isError
        ? String(listQuery.error)
        : null;
  const refetching = listQuery.isFetching && listQuery.data !== undefined;

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const fromIdx = total === 0 ? 0 : page * NEWSLETTER_ADMIN_PAGE_SIZE + 1;
  const toIdx = Math.min(total, (page + 1) * NEWSLETTER_ADMIN_PAGE_SIZE);
  const lastPage = Math.max(0, Math.ceil(total / NEWSLETTER_ADMIN_PAGE_SIZE) - 1);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await downloadAdminNewsletterSubscribersCsv();
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : "Erro ao exportar");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-full border border-[color:var(--brand-primary)]/10 bg-white/60 p-2 text-[#6D4C41] shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-[var(--brand-primary)]"
            aria-label="Voltar"
          >
            <Home className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <Mail className="h-9 w-9 shrink-0 text-[var(--brand-primary)] sm:h-10 sm:w-10" aria-hidden />
            <div>
              <h1 className="font-playfair text-3xl font-bold tracking-tight text-[var(--brand-primary)] sm:text-4xl">
                Newsletter
              </h1>
              <p className="mt-0.5 font-inter text-sm text-[#6D4C41]">
                Inscritos pelo formulário da vitrine (apenas esta loja).
              </p>
            </div>
          </div>
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting || total === 0}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[color:var(--brand-primary)]/25 bg-white/90 px-3 py-2.5 text-sm font-medium text-[#6D4C41] shadow-sm transition-all hover:border-[color:var(--brand-primary)]/35 hover:bg-white hover:text-[var(--brand-primary)] disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden /> : null}
            <Download className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
            Exportar lista (CSV)
          </button>
          <button
            type="button"
            onClick={() => void listQuery.refetch()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--brand-primary)]/25 bg-white/90 px-3 py-2.5 text-sm font-medium text-[#6D4C41] shadow-sm transition-all hover:border-[color:var(--brand-primary)]/35 hover:bg-white hover:text-[var(--brand-primary)] disabled:opacity-60"
          >
            <RefreshCw className={`h-5 w-5 ${refetching ? "animate-spin" : ""}`} aria-hidden />
            Atualizar
          </button>
        </div>
      </div>

      <div className="w-full min-w-0">
        <div className="rounded-3xl border border-[color:var(--brand-primary)]/10 bg-white/90 p-5 shadow-sm sm:p-8">
          {loadError ? (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</div>
          ) : null}
          {exportError ? (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{exportError}</div>
          ) : null}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-primary)]" aria-label="A carregar" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#6D4C41]">
              Ainda não há inscrições pelo site. Quando os visitantes se inscreverem no formulário da vitrine, os
              e-mails aparecem aqui.
            </p>
          ) : (
            <>
              <p className="mb-4 text-sm text-[#6D4C41]">
                A mostrar {fromIdx}–{toIdx} de {total}
              </p>
              <div className="hidden overflow-hidden rounded-2xl border border-[color:var(--brand-primary)]/10 md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[color:var(--brand-primary)]/10 bg-[var(--brand-primary)]/5 font-semibold text-[var(--brand-primary)]">
                    <tr>
                      <th className="px-4 py-3">E-mail</th>
                      <th className="px-4 py-3">Data de inscrição</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--brand-primary)]/10">
                    {items.map((row) => (
                      <tr key={`${row.email}-${row.subscribedAt}`} className="bg-white/80">
                        <td className="px-4 py-3 font-mono text-[#1B4332]">{row.email}</td>
                        <td className="px-4 py-3 text-[#6D4C41]">{formatDate(row.subscribedAt)}</td>
                        <td className="px-4 py-3 text-[#6D4C41]">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-[color:var(--brand-primary)]/10 rounded-2xl border border-[color:var(--brand-primary)]/10 md:hidden">
                {items.map((row) => (
                  <li key={`${row.email}-${row.subscribedAt}`} className="space-y-1 px-4 py-3">
                    <p className="font-mono text-sm font-medium text-[#1B4332] break-all">{row.email}</p>
                    <p className="text-xs text-[#6D4C41]">{formatDate(row.subscribedAt)}</p>
                    <p className="text-xs text-[#6D4C41]">Estado: {row.status}</p>
                  </li>
                ))}
              </ul>

              {lastPage > 0 ? (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={page <= 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[color:var(--brand-primary)]/20 bg-white px-3 py-2 text-sm font-medium text-[var(--brand-primary)] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden />
                    Anterior
                  </button>
                  <span className="text-sm text-[#6D4C41]">
                    Página {page + 1} de {lastPage + 1}
                  </span>
                  <button
                    type="button"
                    disabled={page >= lastPage}
                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                    className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[color:var(--brand-primary)]/20 bg-white px-3 py-2 text-sm font-medium text-[var(--brand-primary)] disabled:opacity-40"
                  >
                    Seguinte
                    <ChevronRight className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminNewsletterPage;
