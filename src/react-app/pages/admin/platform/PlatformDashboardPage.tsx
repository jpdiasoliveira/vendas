import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { PlatformNewStoresWeekChart } from "@/react-app/components/admin/PlatformNewStoresWeekChart";
import {
  platformApiFetch,
  type PlatformAnalyticsOverviewDto,
  type PlatformNewStoresWeekBucketDto,
  type PlatformStoreRankingRowDto,
} from "@/react-app/services/api";

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(n);

/** Legenda do card de receita recorrente: contagem de assinaturas em cobrança, teste ou pendência (sem jargão de BD). */
const mrrSubscriptionsCaption = (count: number) => {
  if (count === 0) {
    return "Nenhuma assinatura em cobrança, período de teste ou pendência financeira entra nesta estimativa.";
  }
  if (count === 1) {
    return "1 assinatura em cobrança, teste ou pendência de pagamento entra neste valor.";
  }
  return `${count} assinaturas nesses estados entram neste valor.`;
};

const PlatformDashboardPage = () => {
  const [analyticsOverview, setAnalyticsOverview] = useState<PlatformAnalyticsOverviewDto | null>(null);
  const [rankingRows, setRankingRows] = useState<PlatformStoreRankingRowDto[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [weeklyBuckets, setWeeklyBuckets] = useState<PlatformNewStoresWeekBucketDto[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const [overview, ranking] = await Promise.all([
        platformApiFetch<PlatformAnalyticsOverviewDto>("/api/platform/analytics/overview"),
        platformApiFetch<PlatformStoreRankingRowDto[]>("/api/platform/analytics/store-ranking?limit=10"),
      ]);
      setAnalyticsOverview(overview);
      setRankingRows(ranking);
    } catch (err) {
      console.error("[PlatformDashboardPage]", err);
      setAnalyticsOverview({
        mrrBrlEstimated: 0,
        payingOrTrialingSubscriptions: 0,
        activeStoresCount: 0,
        gmvPaidBrlLast30d: 0,
      });
      setRankingRows([]);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const loadWeekly = useCallback(async () => {
    setWeeklyLoading(true);
    try {
      const data = await platformApiFetch<PlatformNewStoresWeekBucketDto[]>(
        "/api/platform/analytics/new-stores-weekly?weeks=8"
      );
      setWeeklyBuckets(data);
    } catch (err) {
      console.error("[PlatformDashboardPage.weekly]", err);
      setWeeklyBuckets([]);
    } finally {
      setWeeklyLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadAnalytics(), loadWeekly()]);
  }, [loadAnalytics, loadWeekly]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const overview = analyticsOverview ?? {
    mrrBrlEstimated: 0,
    payingOrTrialingSubscriptions: 0,
    activeStoresCount: 0,
    gmvPaidBrlLast30d: 0,
  };
  const busy = analyticsLoading || weeklyLoading;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 border-b border-slate-800/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-playfair text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
            Visão geral do negócio: receita recorrente estimada, lojas ativas, vendas e ritmo de abertura de novas lojas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-[color:var(--brand-primary)]/25 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--brand-primary)] shadow-sm transition hover:bg-[#FAF8F3] sm:self-center"
        >
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} aria-hidden />
          Atualizar dados
        </button>
      </div>

      <div className="mb-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[color:var(--brand-primary)]/15 bg-white/95 p-6 shadow-md">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Receita recorrente estimada</p>
          <p className="font-playfair text-3xl font-semibold tabular-nums leading-tight text-[#1B4332]">
            {brl(overview.mrrBrlEstimated)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {mrrSubscriptionsCaption(overview.payingOrTrialingSubscriptions)}
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--brand-primary)]/15 bg-white/95 p-6 shadow-md">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Lojas ativas</p>
          <p className="font-playfair text-3xl font-semibold tabular-nums leading-tight text-[#1B4332]">
            {overview.activeStoresCount}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">Lojas com operação ativa neste momento.</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--brand-primary)]/15 bg-white/95 p-6 shadow-md">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Vendas pagas (30 dias)</p>
          <p className="font-playfair text-3xl font-semibold tabular-nums leading-tight text-[#1B4332]">
            {brl(overview.gmvPaidBrlLast30d)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Soma em reais dos pedidos já pagos nos últimos 30 dias.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800/15 bg-slate-900 p-6 shadow-md">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Lojas que mais venderam (30 dias)
          </p>
          <ol className="space-y-2 text-sm leading-snug text-slate-200">
            {rankingRows.slice(0, 5).map((r, i) => (
              <li key={r.storeId} className="flex justify-between gap-2 border-b border-white/10 pb-2 last:border-0 last:pb-0">
                <span className="min-w-0 truncate">
                  {i + 1}. {r.displayName || r.slug}
                </span>
                <span className="shrink-0 font-mono text-sm tabular-nums text-slate-400">{brl(r.gmvPaidBrlLast30d)}</span>
              </li>
            ))}
            {rankingRows.length === 0 ? <li className="text-xs text-slate-400">Sem dados de ranking.</li> : null}
          </ol>
        </div>
      </div>

      <div className="max-w-3xl">
        <PlatformNewStoresWeekChart buckets={weeklyBuckets} loading={weeklyLoading} />
      </div>
    </div>
  );
};

export default PlatformDashboardPage;
