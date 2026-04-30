import { FileDown, Search, X } from "lucide-react";
import type { Order } from "@/react-app/types";
import { exportClosingPdf } from "@/react-app/lib/exportClosingPdf";
import { formatCurrency } from "@/react-app/utils/format";
import { PERIOD_LABELS, type HistoryPeriodFilter } from "@/react-app/utils/adminOrders";

type AdminOrdersToolbarProps = {
  activeTab: "ativos" | "historico";
  setActiveTab: (t: "ativos" | "historico") => void;
  activeOrders: Order[];
  historyOrders: Order[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  historyPeriodFilter: HistoryPeriodFilter;
  setHistoryPeriodFilter: (p: HistoryPeriodFilter) => void;
  displayedOrders: Order[];
  historyPeriodSummary: { total: number; count: number };
  awaitingShipmentCount: number;
};

export const AdminOrdersToolbar = ({
  activeTab,
  setActiveTab,
  activeOrders,
  historyOrders,
  searchQuery,
  setSearchQuery,
  historyPeriodFilter,
  setHistoryPeriodFilter,
  displayedOrders,
  historyPeriodSummary,
  awaitingShipmentCount,
}: AdminOrdersToolbarProps) => (
  <>
    <div className="mb-4 flex flex-col gap-3 font-inter sm:flex-row sm:flex-wrap sm:items-center">
      <div
        role="tablist"
        aria-label="Abas de pedidos"
        className="inline-flex w-full max-w-full rounded-xl border border-slate-200 bg-slate-100 p-1 sm:w-auto"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "ativos"}
          aria-controls="orders-tab-ativos"
          id="tab-ativos"
          onClick={() => setActiveTab("ativos")}
          className={`min-h-[44px] flex-1 rounded-lg px-4 py-3 text-base font-medium transition-colors sm:flex-none sm:text-sm ${
            activeTab === "ativos" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-800"
          }`}
        >
          Ativos
          <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-semibold text-slate-700">
            {activeOrders.length}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "historico"}
          aria-controls="orders-tab-historico"
          id="tab-historico"
          onClick={() => setActiveTab("historico")}
          className={`min-h-[44px] flex-1 rounded-lg px-4 py-3 text-base font-medium transition-colors sm:flex-none sm:text-sm ${
            activeTab === "historico" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-800"
          }`}
        >
          Histórico
          <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-semibold text-slate-700">
            {historyOrders.length}
          </span>
        </button>
      </div>
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nome do cliente..."
          className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-base text-slate-800 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
          aria-label="Buscar pedidos por nome do cliente"
        />
      </div>
    </div>

    {activeTab === "ativos" && awaitingShipmentCount > 0 && (
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 font-inter text-slate-800">
        <span className="text-2xl" aria-hidden>
          📦
        </span>
        <span className="font-semibold">{awaitingShipmentCount} pedido(s) aguardando envio</span>
      </div>
    )}

    {activeTab === "historico" && (
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium text-slate-600">Período:</span>
          {(["hoje", "ontem", "7dias", "este_mes"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setHistoryPeriodFilter(key)}
              className={`min-h-[44px] rounded-xl border px-4 py-2.5 text-base font-medium transition-colors sm:text-sm ${
                historyPeriodFilter === key
                  ? "border border-blue-200 bg-blue-50 text-blue-700"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {PERIOD_LABELS[key]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setHistoryPeriodFilter("todos")}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:text-sm"
          >
            <X className="h-3.5 w-3.5" />
            Limpar Filtros
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 font-inter text-sm text-slate-800">
            <span className="font-semibold">Vendas no Período:</span> {formatCurrency(historyPeriodSummary.total)}{" "}
            <span className="text-slate-500">|</span> <span className="font-semibold">Pedidos:</span>{" "}
            {historyPeriodSummary.count}
          </div>
          <button
            type="button"
            onClick={() => {
              void exportClosingPdf({
                orders: displayedOrders,
                periodLabel: PERIOD_LABELS[historyPeriodFilter],
              });
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[color:var(--brand-primary)]/20 bg-[var(--brand-primary-soft)] px-4 py-3 text-base font-medium text-[var(--brand-primary)] shadow-sm transition-colors hover:brightness-95"
            aria-label="Exportar relatório de fechamento em PDF"
          >
            <FileDown className="h-5 w-5" />
            Exportar PDF
          </button>
        </div>
      </div>
    )}
  </>
);
