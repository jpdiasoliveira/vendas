import type { PlatformNewStoresWeekBucketDto } from "@/react-app/services/api";

const BAR_AREA_PX = 140;
const VALUE_ROW_PX = 22;
const ZERO_BAR_PX = 4;
const MIN_VALUE_BAR_PX = 10;

type PlatformNewStoresWeekBarsProps = {
  buckets: PlatformNewStoresWeekBucketDto[];
  maxCount: number;
};

export function PlatformNewStoresWeekBars({ buckets, maxCount }: PlatformNewStoresWeekBarsProps) {
  const yMid = Math.max(0, Math.round(maxCount / 2));

  return (
    <div className="mt-5 flex gap-2 sm:gap-3">
      <div
        className="flex w-7 shrink-0 flex-col justify-between text-right text-xs tabular-nums leading-none text-content-muted sm:w-8"
        style={{ height: BAR_AREA_PX, marginTop: VALUE_ROW_PX }}
        aria-hidden
      >
        <span>{maxCount}</span>
        <span>{yMid}</span>
        <span>0</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex gap-0.5 sm:gap-1.5" style={{ minHeight: VALUE_ROW_PX }}>
          {buckets.map((bucket) => (
            <div key={`${bucket.weekStartIso}-val`} className="flex min-w-0 flex-1 items-end justify-center pb-0.5">
              {bucket.count > 0 ? (
                <span className="text-xs font-semibold tabular-nums text-brand-primary">{bucket.count}</span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="relative" style={{ height: BAR_AREA_PX }}>
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-px w-full bg-brand-primary/10" />
            ))}
          </div>

          <div className="relative z-10 flex h-full items-end gap-0.5 sm:gap-1.5">
            {buckets.map((bucket) => {
              const barPx =
                bucket.count === 0
                  ? ZERO_BAR_PX
                  : Math.max(MIN_VALUE_BAR_PX, Math.round((bucket.count / maxCount) * BAR_AREA_PX));
              const tooltipText = `${bucket.label}: ${bucket.count} ${bucket.count === 1 ? "loja nova" : "lojas novas"}`;

              return (
                <div
                  key={bucket.weekStartIso}
                  className="group relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-end"
                >
                  <div
                    className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-brand-primary/15 bg-surface-muted px-2 py-1 text-[11px] font-medium text-content opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
                    role="tooltip"
                  >
                    {tooltipText}
                  </div>
                  <div
                    className={`w-full max-w-[2.75rem] rounded-t-md transition-[height,background-color] duration-200 ${
                      bucket.count === 0
                        ? "bg-surface-muted ring-1 ring-brand-primary/10"
                        : "bg-brand-primary shadow-sm ring-1 ring-brand-primary/25"
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
          {buckets.map((bucket) => (
            <div
              key={`${bucket.weekStartIso}-label`}
              className="min-w-0 flex-1 text-center text-xs leading-tight text-content-muted"
              title={bucket.label}
            >
              <span className="line-clamp-2 block break-words sm:line-clamp-none">{bucket.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
