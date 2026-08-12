import { DollarSign, Flame, ScrollText } from "lucide-react";
import { formatCurrency } from "@/react-app/utils/format";
import type { AuditLogReport } from "@/shared/types";

type AdminOrdersDashboardProps = {
  totalSales: number;
  topSellerNames: string[];
  latestLogs: AuditLogReport[];
  loading: boolean;
};

export function AdminOrdersDashboard({
  totalSales,
  topSellerNames,
  latestLogs,
  loading,
}: AdminOrdersDashboardProps) {
  return (
    <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-brand-primary/15 bg-surface-elevated p-4">
        <div className="mb-2 flex items-center gap-2 text-brand-primary">
          <DollarSign className="h-5 w-5" />
          <p className="text-sm font-semibold">Total de Vendas</p>
        </div>
        <p className="font-display text-2xl font-bold text-content">{formatCurrency(totalSales)}</p>
        <p className="mt-1 text-xs text-content-muted">
          Somatório de pedidos pagos, aprovados, enviados ou entregues.
        </p>
      </div>
      <div className="rounded-2xl border border-brand-primary/15 bg-surface-elevated p-4">
        <div className="mb-2 flex items-center gap-2 text-brand-primary">
          <Flame className="h-5 w-5" />
          <p className="text-sm font-semibold">Produtos Mais Vendidos</p>
        </div>
        {loading ? (
          <p className="text-sm text-content-muted">Carregando...</p>
        ) : topSellerNames.length === 0 ? (
          <p className="text-sm text-content-muted">Sem ranking recente.</p>
        ) : (
          <ul className="space-y-1 text-sm text-content-muted">
            {topSellerNames.map((name, idx) => (
              <li key={`${name}-${idx}`} className="truncate">
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-2xl border border-brand-primary/15 bg-surface-elevated p-4">
        <div className="mb-2 flex items-center gap-2 text-brand-primary">
          <ScrollText className="h-5 w-5" />
          <p className="text-sm font-semibold">Últimos Logs</p>
        </div>
        {loading ? (
          <p className="text-sm text-content-muted">Carregando...</p>
        ) : latestLogs.length === 0 ? (
          <p className="text-sm text-content-muted">Sem eventos recentes.</p>
        ) : (
          <ul className="space-y-1 text-xs text-content-muted">
            {latestLogs.map((log) => (
              <li key={log.id} className="truncate" title={log.acao_descricao}>
                {log.acao_descricao}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
