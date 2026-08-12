import type { PlatformAnalyticsOverviewDto, PlatformStoreRankingRowDto } from "@/react-app/services/api";
import {
  formatPlatformBrl,
  mrrSubscriptionsCaption,
} from "@/react-app/components/platform/dashboard/platformDashboardUtils";
import { PlatformStoreRankingCard } from "@/react-app/components/platform/dashboard/PlatformStoreRankingCard";

type PlatformStatsGridProps = {
  overview: PlatformAnalyticsOverviewDto;
  ranking: PlatformStoreRankingRowDto[];
};

const statCardClass =
  "rounded-2xl border border-brand-primary/10 bg-surface-elevated p-6 shadow-sm";

export function PlatformStatsGrid({ overview, ranking }: PlatformStatsGridProps) {
  return (
    <div className="mb-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <div className={statCardClass}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">
          Receita recorrente estimada
        </p>
        <p className="font-display text-3xl font-semibold tabular-nums leading-tight text-brand-primary">
          {formatPlatformBrl(overview.mrrBrlEstimated)}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-content-muted">
          {mrrSubscriptionsCaption(overview.payingOrTrialingSubscriptions)}
        </p>
      </div>
      <div className={statCardClass}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">Lojas ativas</p>
        <p className="font-display text-3xl font-semibold tabular-nums leading-tight text-brand-primary">
          {overview.activeStoresCount}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-content-muted">Lojas com operação ativa neste momento.</p>
      </div>
      <div className={statCardClass}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">Vendas pagas (30 dias)</p>
        <p className="font-display text-3xl font-semibold tabular-nums leading-tight text-brand-primary">
          {formatPlatformBrl(overview.gmvPaidBrlLast30d)}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-content-muted">
          Soma em reais dos pedidos já pagos nos últimos 30 dias.
        </p>
      </div>
      <PlatformStoreRankingCard rows={ranking} />
    </div>
  );
}
