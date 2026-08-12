import { FileDown, Search, X } from "lucide-react";
import type { Order } from "@/react-app/types";
import { exportClosingPdf } from "@/react-app/lib/exportClosingPdf";
import { formatCurrency } from "@/react-app/utils/format";
import { PERIOD_LABELS, type HistoryPeriodFilter } from "@/react-app/utils/adminOrders";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";

type AdminOrdersFiltersProps = {
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

export function AdminOrdersFilters({
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
}: AdminOrdersFiltersProps) {
  const tabClass = (active: boolean) =>
    `min-h-[44px] flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-colors sm:flex-none ${
      active
        ? "bg-surface-elevated text-content shadow-sm ring-1 ring-brand-primary/15"
        : "text-content-muted hover:text-content"
    }`;

  const periodClass = (active: boolean) =>
    `min-h-[44px] rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
      active
        ? "border-brand-primary/30 bg-brand-primary/10 text-brand-primary"
        : "border-brand-primary/15 bg-surface-elevated text-content-muted hover:bg-surface-muted"
    }`;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div
          role="tablist"
          aria-label="Abas de pedidos"
          className="inline-flex w-full max-w-full rounded-xl border border-brand-primary/15 bg-surface-muted p-1 sm:w-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "ativos"}
            onClick={() => setActiveTab("ativos")}
            className={tabClass(activeTab === "ativos")}
          >
            Ativos
            <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-surface px-1.5 text-xs font-semibold text-content-muted">
              {activeOrders.length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "historico"}
            onClick={() => setActiveTab("historico")}
            className={tabClass(activeTab === "historico")}
          >
            Histórico
            <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-surface px-1.5 text-xs font-semibold text-content-muted">
              {historyOrders.length}
            </span>
          </button>
        </div>
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome do cliente..."
            className={`${storefrontInputClass} min-h-[48px] pl-10`}
            aria-label="Buscar pedidos por nome do cliente"
          />
        </div>
      </div>

      {activeTab === "ativos" && awaitingShipmentCount > 0 ? (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-brand-primary/15 bg-surface-elevated p-4 text-content">
          <span className="text-2xl" aria-hidden>
            📦
          </span>
          <span className="font-semibold">{awaitingShipmentCount} pedido(s) aguardando envio</span>
        </div>
      ) : null}

      {activeTab === "historico" ? (
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-medium text-content-muted">Período:</span>
            {(["hoje", "ontem", "7dias", "este_mes"] as const).map((key) => (
              <button key={key} type="button" onClick={() => setHistoryPeriodFilter(key)} className={periodClass(historyPeriodFilter === key)}>
                {PERIOD_LABELS[key]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setHistoryPeriodFilter("todos")}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-brand-primary/15 bg-surface-elevated px-4 py-2.5 text-sm font-medium text-content-muted transition-colors hover:bg-surface-muted"
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-xl border border-brand-primary/15 bg-surface-elevated p-3 text-sm text-content">
              <span className="font-semibold">Vendas no período:</span> {formatCurrency(historyPeriodSummary.total)}{" "}
              <span className="text-content-muted">|</span>{" "}
              <span className="font-semibold">Pedidos:</span> {historyPeriodSummary.count}
            </div>
            <button
              type="button"
              onClick={() => {
                void exportClosingPdf({
                  orders: displayedOrders,
                  periodLabel: PERIOD_LABELS[historyPeriodFilter],
                });
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-brand-primary/20 bg-brand-primary/10 px-4 py-3 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/15"
              aria-label="Exportar relatório de fechamento em PDF"
            >
              <FileDown className="h-5 w-5" />
              Exportar PDF
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
