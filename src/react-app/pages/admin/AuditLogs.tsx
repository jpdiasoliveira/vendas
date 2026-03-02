import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { RefreshCw, Home, History } from "lucide-react";
import { adminApiFetch } from "@/react-app/lib/api";
import { AdminNav } from "@/react-app/components/admin/AdminNav";

export interface AuditLogEntry {
  id: string;
  created_at: string;
  user_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, unknown> | null;
}

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const actionLabel: Record<string, string> = {
  CREATE_PRODUCT: "Criar produto",
  UPDATE_PRODUCT: "Atualizar produto",
  DELETE_PRODUCT: "Excluir produto",
  UPDATE_ORDER_STATUS: "Atualizar status do pedido",
};

export default function AuditLogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const data = await adminApiFetch<AuditLogEntry[]>("/api/admin/audit-logs");
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar logs";
      setError(msg);
      setForbidden(msg.includes("restrito") || msg.includes("403"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (forbidden) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <History className="h-16 w-16 text-[#1B4332]/50 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#1B4332] font-playfair mb-2">
            Acesso restrito
          </h1>
          <p className="text-[#6D4C41] font-inter">
            Apenas administradores podem visualizar os logs de atividade.
          </p>
          <button
            onClick={() => navigate("/admin/pedidos")}
            className="mt-6 px-4 py-2 bg-[#1B4332] text-white rounded-xl font-medium hover:bg-[#1B4332]/90 transition-colors"
          >
            Voltar ao painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 bg-white/60 backdrop-blur-sm rounded-full text-[#6D4C41] hover:text-[#1B4332] hover:bg-white transition-all shadow-sm border border-[#1B4332]/10"
              aria-label="Voltar"
            >
              <Home className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <History className="h-8 w-8 text-[#1B4332]" />
              <div>
                <h1 className="text-2xl font-bold text-[#1B4332] font-playfair">
                  Logs de Atividade
                </h1>
                <p className="text-sm text-[#6D4C41] font-inter">
                  Histórico de ações no painel
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AdminNav />
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-white/80 hover:bg-white border border-[#1B4332]/20 text-[#1B4332] px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm disabled:opacity-60"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
        </div>

        {error && !forbidden && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-inter">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="h-8 w-8 text-[#1B4332] animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-[#1B4332]/10 p-12 text-center text-[#6D4C41] font-inter">
            Nenhum registro de atividade ainda.
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-[#1B4332]/10 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full font-inter text-sm">
                <thead>
                  <tr className="bg-[#1B4332]/5 text-[#1B4332] font-semibold">
                    <th className="text-left py-3 px-4">Data / Hora</th>
                    <th className="text-left py-3 px-4">Usuário</th>
                    <th className="text-left py-3 px-4">Ação</th>
                    <th className="text-left py-3 px-4">Recurso</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-t border-[#1B4332]/10 hover:bg-[#1B4332]/5 transition-colors"
                    >
                      <td className="py-3 px-4 text-[#6D4C41] whitespace-nowrap">
                        {formatDateTime(entry.created_at)}
                      </td>
                      <td className="py-3 px-4 text-[#6D4C41]">
                        {entry.user_email ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-[#1B4332] font-medium">
                        {actionLabel[entry.action] ?? entry.action}
                      </td>
                      <td className="py-3 px-4 text-[#6D4C41]">
                        {entry.resource_type} #{entry.resource_id}
                        {entry.details?.status != null && (
                          <span className="ml-1 text-[#1B4332]/80">
                            → {String(entry.details.status)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
