import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  RefreshCw,
  Home,
  History,
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { adminApiFetch } from "@/react-app/lib/api";
import { AdminNav } from "@/react-app/components/admin/AdminNav";
import type { AuditLogReport } from "@/shared/types";

/** Valores de action na API (query param). */
const ACTION_OPTIONS = [
  { value: "", label: "Todas as ações" },
  { value: "CREATE_PRODUCT", label: "Criar" },
  { value: "UPDATE_PRODUCT", label: "Editar" },
  { value: "DELETE_PRODUCT", label: "Excluir" },
  { value: "UPDATE_ORDER_STATUS", label: "Pedido" },
] as const;

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

/** Extrai o nome real do recurso a partir de details; fallback: resource_id encurtado. */
const getResourceDisplayName = (entry: AuditLogReport): string => {
  const d = (entry.detalhes ?? {}) as Record<string, unknown>;
  if (entry.tipo === "product") {
    const name = (d.product_name ?? d.name) as string | undefined;
    if (name && String(name).trim()) return String(name).trim();
  }
  if (entry.tipo === "order") {
    const customer = d.customer_name as string | undefined;
    if (customer && String(customer).trim()) return String(customer).trim();
    const orderNum = (d.order_number ?? d.order_id) as string | number | undefined;
    if (orderNum != null) return String(orderNum);
  }
  const rid = entry.resource_id;
  if (rid && typeof rid === "string" && rid.length > 0)
    return `ID: ${rid.slice(0, 4)}${rid.length > 4 ? "…" : ""}`;
  return entry.nome_recurso || "—";
};

/** Frase amigável da ação usando action_key e nome do recurso. */
const getFriendlyActionMessage = (entry: AuditLogReport): string => {
  const nameOrId = getResourceDisplayName(entry);
  const key = entry.action_key ?? "";
  const d = (entry.detalhes ?? {}) as Record<string, unknown>;
  switch (key) {
    case "CREATE_PRODUCT":
      return `Criou o produto ${nameOrId}`;
    case "UPDATE_PRODUCT":
      return `Editou o produto ${nameOrId}`;
    case "DELETE_PRODUCT":
      return `Excluiu o produto ${nameOrId}`;
    case "UPDATE_ORDER_STATUS": {
      const status = (d.status as string) ?? "?";
      return `Mudou o status do pedido #${nameOrId} para ${status}`;
    }
    default:
      return entry.acao_descricao;
  }
};

/** Traduz valor do campo active/status para exibição. */
const formatActiveValue = (v: unknown): string => {
  const s = String(v ?? "").toLowerCase();
  if (s === "active" || s === "true" || s === "1") return "Ativo";
  if (s === "inactive" || s === "false" || s === "0") return "Inativo";
  return s || "—";
};

/** Formata valor para exibição no diff (preço, estoque, active). */
const formatChangeValue = (
  key: string,
  value: unknown
): string => {
  if (key === "price" || key === "price_wholesale") {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  }
  if (key === "active") return formatActiveValue(value);
  return String(value ?? "—");
};

/** Label amigável do campo no diff. */
const CHANGE_LABELS: Record<string, string> = {
  price: "Preço",
  price_wholesale: "Preço atacado",
  stock: "Estoque",
  active: "Status",
};

/** Exibe detalhes de forma legível (ex: status do pedido). */
const formatDetalhes = (detalhes: unknown): string => {
  if (detalhes == null) return "";
  if (typeof detalhes === "object" && detalhes !== null && "status" in detalhes) {
    return String((detalhes as { status: unknown }).status);
  }
  if (typeof detalhes === "object") {
    const entries = Object.entries(detalhes as Record<string, unknown>).filter(
      ([_, v]) => v != null
    );
    if (entries.length === 0) return "";
    return entries.map(([k, v]) => `${k}: ${String(v)}`).join(" · ");
  }
  return String(detalhes);
};

/** Ícone e estilo por tipo de ação: verde (criação), amarelo (edição), neutro (exclusão). */
const getActionStyle = (
  acaoDescricao: string
): { Icon: LucideIcon; iconBg: string; iconColor: string; borderColor: string } => {
  if (acaoDescricao.includes("Criar")) {
    return {
      Icon: PlusCircle,
      iconBg: "bg-[#1B4332]/15",
      iconColor: "text-[#1B4332]",
      borderColor: "border-[#1B4332]/30",
    };
  }
  if (acaoDescricao.includes("Excluir")) {
    return {
      Icon: Trash2,
      iconBg: "bg-[#6D4C41]/15",
      iconColor: "text-[#6D4C41]",
      borderColor: "border-[#6D4C41]/30",
    };
  }
  return {
    Icon: Pencil,
    iconBg: "bg-[#FFD166]/40",
    iconColor: "text-[#B8860B]",
    borderColor: "border-[#FFD166]/60",
  };
};

/** Skeleton da timeline (itens verticais). */
const TimelineSkeleton = () => (
  <div className="space-y-0">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-4 animate-pulse">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 rounded-full bg-[#1B4332]/15 shrink-0" />
          {i < 4 && <div className="w-0.5 flex-1 min-h-[3rem] bg-[#1B4332]/10 mt-2" />}
        </div>
        <div className="flex-1 pb-8">
          <div className="h-4 w-28 bg-[#1B4332]/10 rounded mb-2" />
          <div className="h-4 w-48 bg-[#1B4332]/10 rounded mb-1" />
          <div className="h-3 w-36 bg-[#1B4332]/10 rounded" />
        </div>
      </div>
    ))}
  </div>
);

const DEBOUNCE_MS = 500;

export default function AuditLogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLogReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    const params = new URLSearchParams();
    if (searchDebounced) params.set("search", searchDebounced);
    if (actionFilter) params.set("action", actionFilter);
    const qs = params.toString();
    const url = `/api/admin/audit-logs${qs ? `?${qs}` : ""}`;
    try {
      const data = await adminApiFetch<AuditLogReport[]>(url);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar logs";
      setError(msg);
      setForbidden(msg.includes("restrito") || msg.includes("403"));
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (forbidden) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <History className="h-16 w-16 text-[#1B4332]/50 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#1B4332] font-playfair mb-2">
            Acesso restrito
          </h1>
          <p className="text-[#6D4C41] font-inter">
            Apenas administradores podem visualizar o histórico de atividades.
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
      <div className="max-w-2xl mx-auto">
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
                  Histórico de Atividades
                </h1>
                <p className="text-sm text-[#6D4C41] font-inter">
                  Quem criou, editou ou excluiu produtos e alterou status dos pedidos
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
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-inter text-sm">
            {error}
          </div>
        )}

        {/* Barra de filtros */}
        <div className="mb-6 p-4 bg-[#FAF8F3]/90 border border-[#1B4332]/15 rounded-2xl shadow-sm font-inter">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6D4C41]/70 pointer-events-none" />
              <input
                type="search"
                placeholder="Buscar por nome do produto ou pedido..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-[#1B4332]/20 rounded-xl text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-colors"
                aria-label="Busca por recurso"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/80 border border-[#1B4332]/20 rounded-xl text-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-colors cursor-pointer font-inter"
                aria-label="Filtrar por tipo de ação"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-[#1B4332]/10 p-6 shadow-sm">
            <TimelineSkeleton />
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-[#1B4332]/10 p-12 text-center text-[#6D4C41] font-inter">
            Nenhum registro de atividade ainda.
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-[#1B4332]/10 p-6 shadow-sm">
            {/* Timeline vertical */}
            <div className="relative">
              {logs.map((entry, index) => {
                const { Icon, iconBg, iconColor, borderColor } = getActionStyle(
                  entry.acao_descricao
                );
                const detalhes = (entry.detalhes ?? {}) as Record<string, unknown>;
                const changes = detalhes.changes as Record<string, { from: unknown; to: unknown }> | undefined;
                const detalhesStr = !changes ? formatDetalhes(entry.detalhes) : "";
                const isLast = index === logs.length - 1;

                return (
                  <div key={entry.id} className="flex gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      <div
                        className={`h-10 w-10 rounded-full border-2 flex items-center justify-center ${iconBg} ${iconColor} ${borderColor}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {!isLast && (
                        <div
                          className="w-0.5 flex-1 min-h-[2rem] mt-2 bg-[#1B4332]/15"
                          aria-hidden
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 font-inter">
                        {formatDateTime(entry.data_hora)}
                      </p>
                      <p className="font-semibold text-[#1B4332] font-inter mt-0.5">
                        {getFriendlyActionMessage(entry)}
                      </p>
                      <p className="text-sm text-[#6D4C41] font-inter mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#1B4332] font-inter">
                          {entry.usuario_email || "—"}
                        </span>
                        <span className="text-[#6D4C41]/80">·</span>
                        <span
                          className={
                            entry.tipo === "order"
                              ? "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                              : "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-orange-100 text-orange-800"
                          }
                        >
                          {entry.tipo === "product" ? "Produto" : "Pedido"}
                        </span>
                      </p>
                      {changes && Object.keys(changes).length > 0 && (
                        <ul className="mt-2 pl-4 space-y-1 text-xs text-gray-500 font-inter list-disc">
                          {Object.entries(changes).map(([key, { from, to }]) => (
                            <li key={key} className="flex flex-wrap items-center gap-1.5">
                              <span className="text-gray-600">
                                {CHANGE_LABELS[key] ?? key}:
                              </span>
                              <span>{formatChangeValue(key, from)}</span>
                              <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden />
                              <span>{formatChangeValue(key, to)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {detalhesStr && (
                        <p className="text-xs text-[#6D4C41]/90 mt-1 font-inter">
                          {detalhesStr}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
