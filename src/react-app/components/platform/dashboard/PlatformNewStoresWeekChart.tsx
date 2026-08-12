import type { PlatformNewStoresWeekBucketDto } from "@/react-app/services/api";
import { PlatformNewStoresWeekBars } from "@/react-app/components/platform/dashboard/PlatformNewStoresWeekBars";

type PlatformNewStoresWeekChartProps = {
  buckets: PlatformNewStoresWeekBucketDto[];
  loading?: boolean;
};

export function PlatformNewStoresWeekChart({ buckets, loading }: PlatformNewStoresWeekChartProps) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-brand-primary/10 bg-surface-elevated text-sm text-content-muted">
        A carregar…
      </div>
    );
  }

  if (buckets.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-brand-primary/15 bg-surface-elevated text-sm text-content-muted">
        Ainda não há dados de novas lojas neste período.
      </div>
    );
  }

  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div className="rounded-2xl border border-brand-primary/10 bg-surface-elevated p-5 shadow-sm sm:p-6">
      <h3 className="font-display text-lg font-semibold leading-snug text-content">Novas lojas por semana</h3>
      <p className="mt-1 text-sm leading-relaxed text-content-muted">
        Contagem por semana civil, de segunda a domingo.
      </p>
      <PlatformNewStoresWeekBars buckets={buckets} maxCount={maxCount} />
      <p className="mt-3 text-xs text-content-muted">
        Escala no eixo Y relativa ao máximo desta janela ({maxCount} na semana mais alta). Passe o rato sobre uma barra
        para o detalhe.
      </p>
    </div>
  );
}
