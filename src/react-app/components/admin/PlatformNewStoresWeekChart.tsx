import type { PlatformNewStoresWeekBucketDto } from "@/react-app/services/api";

type PlatformNewStoresWeekChartProps = {
  buckets: PlatformNewStoresWeekBucketDto[];
  loading?: boolean;
};

/** Altura útil só das barras (eixo Y e grade alinham aqui). */
const BAR_AREA_PX = 140;
/** Linha reservada acima da área das barras para o valor no topo da barra. */
const VALUE_ROW_PX = 22;
const ZERO_BAR_PX = 4;
const MIN_VALUE_BAR_PX = 10;

/**
 * Gráfico de barras (sem lib externa): novas lojas por semana (UTC, início à segunda).
 * Barras sólidas, grade horizontal, valores no topo da barra ou em tooltip.
 */
export const PlatformNewStoresWeekChart = ({ buckets, loading }: PlatformNewStoresWeekChartProps) => {
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));
  const yMid = Math.max(0, Math.round(maxCount / 2));

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
      <h3 className="font-playfair text-lg font-semibold leading-snug text-[#1B4332]">Novas lojas por semana</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-400">Contagem por semana civil, de segunda a domingo.</p>

      <div className="mt-5 flex gap-2 sm:gap-3">
        <div
          className="flex w-7 shrink-0 flex-col justify-between text-right text-xs tabular-nums leading-none text-slate-400 sm:w-8"
          style={{ height: BAR_AREA_PX, marginTop: VALUE_ROW_PX }}
          aria-hidden
        >
          <span>{maxCount}</span>
          <span>{yMid}</span>
          <span>0</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex gap-0.5 sm:gap-1.5" style={{ minHeight: VALUE_ROW_PX }}>
            {buckets.map((b) => (
              <div key={`${b.weekStartIso}-val`} className="flex min-w-0 flex-1 items-end justify-center pb-0.5">
                {b.count > 0 ? (
                  <span className="text-xs font-semibold tabular-nums text-[#1B4332]">{b.count}</span>
                ) : null}
              </div>
            ))}
          </div>

          <div className="relative" style={{ height: BAR_AREA_PX }}>
            <div
              className="pointer-events-none absolute inset-0 flex flex-col justify-between"
              aria-hidden
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-px w-full bg-slate-100" />
              ))}
            </div>

            <div className="relative z-10 flex h-full items-end gap-0.5 sm:gap-1.5">
              {buckets.map((b) => {
                const barPx =
                  b.count === 0
                    ? ZERO_BAR_PX
                    : Math.max(MIN_VALUE_BAR_PX, Math.round((b.count / maxCount) * BAR_AREA_PX));
                const tooltipText = `${b.label}: ${b.count} ${b.count === 1 ? "loja nova" : "lojas novas"}`;

                return (
                  <div
                    key={b.weekStartIso}
                    className="group relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-end"
                  >
                    <div
                      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
                      role="tooltip"
                    >
                      {tooltipText}
                    </div>

                    <div
                      className={`w-full max-w-[2.75rem] rounded-t-md transition-[height,background-color] duration-200 ${
                        b.count === 0
                          ? "bg-slate-200/70 ring-1 ring-slate-200/80"
                          : "bg-[#1B4332] shadow-sm ring-1 ring-[#1B4332]/20"
                      }`}
                      style={{ height: barPx }}
                      title={tooltipText}
                      role="presentation"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2 flex gap-0.5 sm:gap-1.5">
            {buckets.map((b) => (
              <div
                key={`${b.weekStartIso}-label`}
                className="min-w-0 flex-1 text-center text-xs leading-tight text-slate-500"
                title={b.label}
              >
                <span className="line-clamp-2 block break-words sm:line-clamp-none">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Escala no eixo Y relativa ao máximo desta janela ({maxCount} na semana mais alta). Passe o rato sobre uma barra
        para o detalhe.
      </p>
    </div>
  );
};
