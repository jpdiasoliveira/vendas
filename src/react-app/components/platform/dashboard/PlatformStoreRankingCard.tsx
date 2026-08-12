import type { PlatformStoreRankingRowDto } from "@/react-app/services/api";
import { formatPlatformBrl } from "@/react-app/components/platform/dashboard/platformDashboardUtils";

type PlatformStoreRankingCardProps = {
  rows: PlatformStoreRankingRowDto[];
};

export function PlatformStoreRankingCard({ rows }: PlatformStoreRankingCardProps) {
  return (
    <div className="rounded-2xl border border-brand-primary/10 bg-surface-muted p-6 shadow-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">
        Lojas que mais venderam (30 dias)
      </p>
      <ol className="space-y-2 text-sm leading-snug text-content">
        {rows.slice(0, 5).map((row, index) => (
          <li
            key={row.storeId}
            className="flex justify-between gap-2 border-b border-brand-primary/10 pb-2 last:border-0 last:pb-0"
          >
            <span className="min-w-0 truncate">
              {index + 1}. {row.displayName || row.slug}
            </span>
            <span className="shrink-0 font-mono text-sm tabular-nums text-content-muted">
              {formatPlatformBrl(row.gmvPaidBrlLast30d)}
            </span>
          </li>
        ))}
        {rows.length === 0 ? <li className="text-xs text-content-muted">Sem dados de ranking.</li> : null}
      </ol>
    </div>
  );
}
