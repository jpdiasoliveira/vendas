import { useNavigate } from "react-router";
import { RefreshCw, Home, History } from "lucide-react";
import { AdminNav } from "@/react-app/components/admin/AdminNav";
import { AuditLogsFilters } from "@/react-app/components/admin/AuditLogsFilters";
import { AuditLogsSkeleton } from "@/react-app/components/admin/AuditLogsSkeleton";
import { AuditLogsList } from "@/react-app/components/admin/AuditLogsList";
import { useAuditLogs } from "@/react-app/hooks/useAuditLogs";

const AuditLogsPage = () => {
  const navigate = useNavigate();
  const m = useAuditLogs();

  if (m.forbidden) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mx-auto max-w-md text-center">
            <History className="mx-auto mb-4 h-16 w-16 text-[#1B4332]/50" />
            <h1 className="mb-2 font-playfair text-xl font-bold text-[#1B4332]">Acesso restrito</h1>
            <p className="font-inter text-[#6D4C41]">Apenas administradores podem visualizar o histórico de atividades.</p>
            <button
              type="button"
              onClick={() => navigate("/admin/pedidos")}
              className="mt-6 rounded-xl bg-[#1B4332] px-4 py-2 font-medium text-white transition-colors hover:bg-[#1B4332]/90"
            >
              Voltar ao painel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] px-4 pb-12 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-full border border-[#1B4332]/10 bg-white/60 p-2 text-[#6D4C41] shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-[#1B4332]"
              aria-label="Voltar"
            >
              <Home className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <History className="h-8 w-8 text-[#1B4332]" />
              <div>
                <h1 className="font-playfair text-2xl font-bold text-[#1B4332]">Histórico de Atividades</h1>
                <p className="font-inter text-sm text-[#6D4C41]">Alterações em produtos e pedidos</p>
              </div>
            </div>
          </div>
          <div className="w-full min-w-0 sm:w-auto">
            <AdminNav>
              <button
                type="button"
                onClick={() => void m.fetchLogs()}
                disabled={m.loading}
                className="inline-flex items-center gap-2 rounded-xl border border-[#1B4332]/20 bg-white/80 px-4 py-2.5 font-medium text-[#1B4332] shadow-sm transition-all hover:bg-white disabled:opacity-60"
              >
                <RefreshCw className={`h-5 w-5 ${m.loading ? "animate-spin" : ""}`} />
                Atualizar
              </button>
            </AdminNav>
          </div>
        </div>

        {m.error && !m.forbidden && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 font-inter text-sm text-amber-800">{m.error}</div>
        )}

        <AuditLogsFilters
          searchInput={m.searchInput}
          setSearchInput={m.setSearchInput}
          actionFilter={m.actionFilter}
          setActionFilter={m.setActionFilter}
        />

        {m.loading ? (
          <div className="rounded-2xl border border-[#1B4332]/10 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
            <AuditLogsSkeleton />
          </div>
        ) : m.logs.length === 0 ? (
          <div className="rounded-2xl border border-[#1B4332]/10 bg-white/70 p-12 text-center font-inter text-[#6D4C41] backdrop-blur-sm">
            Nenhum registro de atividade ainda.
          </div>
        ) : (
          <AuditLogsList logs={m.logs} />
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
