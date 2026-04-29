import type { PlatformNewStoresWeekBucketDto } from "@/react-app/services/api";

type PlatformNewStoresWeekChartProps = {
  buckets: PlatformNewStoresWeekBucketDto[];
  loading?: boolean;
};

/**
 * Gráfico de barras simples (sem lib externa): novas lojas por semana (UTC, início à segunda).
 */
export const PlatformNewStoresWeekChart = ({ buckets, loading }: PlatformNewStoresWeekChartProps) => {
  const max = Math.max(1, ...buckets.map((b) => b.count));

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-800/10 bg-white/90 text-sm text-slate-400">
        A carregar…
      </div>
    );
  }

  if (buckets.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-800/15 bg-white/60 text-sm text-slate-400">
        Ainda não há dados de novas lojas neste período.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[color:var(--brand-primary)]/15 bg-white/95 p-5 shadow-md sm:p-6">
      <h3 className="font-playfair text-lg font-semibold text-[#1B4332]">Novas lojas por semana</h3>
      <p className="mt-1 text-sm text-slate-400">Contagem por semana civil, de segunda a domingo.</p>
      <div className="mt-4 flex h-40 items-end justify-between gap-1.5 sm:gap-2">
        {buckets.map((b) => {
          const barPx = Math.max(b.count > 0 ? 6 : 0, Math.round((b.count / max) * 120));
          return (
            <div key={b.weekStartIso} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs font-semibold tabular-nums text-[#1B4332]">{b.count}</span>
              <div
                className="w-full max-w-[2.75rem] rounded-t-md bg-[var(--brand-primary)]/85 transition-all"
                style={{ height: `${barPx}px` }}
                title={`${b.label}: ${b.count} loja(s)`}
                role="img"
                aria-label={`${b.label}, ${b.count} novas lojas`}
              />
              <span className="line-clamp-2 max-w-full text-center text-xs font-medium leading-tight text-slate-400">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Altura relativa ao pico da janela ({max} loja(s) na semana mais forte).
      </p>
    </div>
  );
};
