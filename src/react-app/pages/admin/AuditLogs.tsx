import { useNavigate } from "react-router";
import { RefreshCw, History } from "lucide-react";
import { AuditLogsFilters } from "@/react-app/components/admin/AuditLogsFilters";
import { AuditLogsSkeleton } from "@/react-app/components/admin/AuditLogsSkeleton";
import { AuditLogsList } from "@/react-app/components/admin/AuditLogsList";
import { useAuditLogs } from "@/react-app/hooks/useAuditLogs";

const AuditLogsPage = () => {
  const navigate = useNavigate();
  const m = useAuditLogs();

  if (m.forbidden) {
    return (
      <div className="mx-auto max-w-md text-center">
        <History className="mx-auto mb-4 h-16 w-16 text-content-muted/50" />
        <h1 className="mb-2 font-display text-xl font-bold text-content">Acesso restrito</h1>
        <p className="text-content-muted">Apenas administradores podem visualizar o histórico de atividades.</p>
        <button
          type="button"
          onClick={() => navigate("/admin/pedidos")}
          className="mt-6 rounded-xl bg-brand-primary px-4 py-2 font-medium text-white transition-colors hover:opacity-90"
        >
          Voltar ao painel
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <History className="h-9 w-9 shrink-0 text-brand-primary sm:h-10 sm:w-10" />
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-content sm:text-4xl">
              Histórico de Atividades
            </h1>
            <p className="mt-0.5 text-sm text-content-muted">Alterações em produtos e pedidos</p>
          </div>
        </div>
        <div className="flex w-full min-w-0 justify-end sm:w-auto">
          <button
            type="button"
            onClick={() => void m.refetch()}
            disabled={m.loading}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/20 bg-surface-elevated px-3 py-2.5 text-sm font-medium text-content-muted shadow-sm transition-all hover:border-brand-primary/30 hover:bg-surface-muted hover:text-content disabled:opacity-60"
          >
            <RefreshCw className={`h-5 w-5 ${m.loading || m.refetching ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>
      </div>

      {m.error ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          {m.error}
        </div>
      ) : null}

      <AuditLogsFilters
        searchInput={m.searchInput}
        setSearchInput={m.setSearchInput}
        actionFilter={m.actionFilter}
        setActionFilter={m.setActionFilter}
      />

      {m.loading ? (
        <div className="rounded-2xl border border-brand-primary/10 bg-surface-elevated p-6 shadow-sm">
          <AuditLogsSkeleton />
        </div>
      ) : m.logs.length === 0 ? (
        <div className="rounded-2xl border border-brand-primary/10 bg-surface-elevated p-12 text-center text-content-muted">
          Nenhum registro de atividade ainda.
        </div>
      ) : (
        <AuditLogsList logs={m.logs} />
      )}
    </>
  );
};

export default AuditLogsPage;
