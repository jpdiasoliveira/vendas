/**
 * Métricas globais (Bloco 4): views `platform_view_admin_*` + `analytics_platform_daily`.
 */

import { getSupabase } from "../supabase.js";

export type PlatformAnalyticsOverview = {
  mrrBrlEstimated: number;
  payingOrTrialingSubscriptions: number;
  activeStoresCount: number;
  gmvPaidBrlLast30d: number;
};

export type PlatformStoreRankingRow = {
  storeId: string;
  slug: string;
  displayName: string;
  storeStatus: string;
  gmvPaidBrlLast30d: number;
  paidOrdersLast30d: number;
  allOrdersLast30d: number;
};

function utcDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isMissingRelation(err: unknown): boolean {
  const code =
    typeof err === "object" && err != null && "code" in err ? String((err as { code?: unknown }).code ?? "") : "";
  const msg =
    typeof err === "object" && err != null && "message" in err
      ? String((err as { message?: unknown }).message ?? "")
      : "";
  return code === "42P01" || /does not exist|relation/i.test(msg);
}

/** Resumo para cards do Super Admin (tolerante a views/tabelas ainda não aplicadas no projeto). */
export async function getPlatformAnalyticsOverview(env: Env): Promise<PlatformAnalyticsOverview> {
  const supabase = getSupabase(env);

  const { data: mrrRow, error: mrrErr } = await supabase
    .from("platform_view_admin_mrr_estimate_current")
    .select("mrr_brl_estimated, paying_or_trialing_subscription_rows")
    .maybeSingle();

  if (mrrErr && !isMissingRelation(mrrErr)) {
    console.error("[getPlatformAnalyticsOverview] mrr view:", mrrErr.message);
  }

  const { count: activeCount, error: storeErr } = await supabase
    .from("stores")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  if (storeErr) {
    console.error("[getPlatformAnalyticsOverview] stores count:", storeErr.message);
  }

  const endUtc = new Date();
  const startUtc = new Date(Date.UTC(endUtc.getUTCFullYear(), endUtc.getUTCMonth(), endUtc.getUTCDate() - 29));
  const fromDay = utcDateString(startUtc);

  const { data: dailyRows, error: dailyErr } = await supabase
    .from("analytics_platform_daily")
    .select("gmv_paid_brl")
    .gte("day", fromDay);

  if (dailyErr && !isMissingRelation(dailyErr)) {
    console.error("[getPlatformAnalyticsOverview] analytics_platform_daily:", dailyErr.message);
  }

  let gmvPaidBrlLast30d = 0;
  for (const r of dailyRows ?? []) {
    const v = Number((r as { gmv_paid_brl?: unknown }).gmv_paid_brl);
    if (Number.isFinite(v)) gmvPaidBrlLast30d += v;
  }

  return {
    mrrBrlEstimated: Number((mrrRow as { mrr_brl_estimated?: unknown })?.mrr_brl_estimated ?? 0) || 0,
    payingOrTrialingSubscriptions:
      Number(
        (mrrRow as { paying_or_trialing_subscription_rows?: unknown })?.paying_or_trialing_subscription_rows ?? 0
      ) || 0,
    activeStoresCount: activeCount ?? 0,
    gmvPaidBrlLast30d,
  };
}

export async function getPlatformStoreRanking(env: Env, limit = 15): Promise<PlatformStoreRankingRow[]> {
  const supabase = getSupabase(env);
  const lim = Math.min(100, Math.max(1, limit));
  const { data, error } = await supabase
    .from("platform_view_admin_store_ranking_gmv")
    .select(
      "store_id, slug, display_name, store_status, gmv_paid_brl_last_30d, paid_orders_last_30d, all_orders_last_30d"
    )
    .order("gmv_paid_brl_last_30d", { ascending: false })
    .limit(lim);

  if (error) {
    if (!isMissingRelation(error)) console.error("[getPlatformStoreRanking]", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    storeId: String((r as { store_id?: unknown }).store_id ?? ""),
    slug: String((r as { slug?: unknown }).slug ?? ""),
    displayName: String((r as { display_name?: unknown }).display_name ?? ""),
    storeStatus: String((r as { store_status?: unknown }).store_status ?? ""),
    gmvPaidBrlLast30d: Number((r as { gmv_paid_brl_last_30d?: unknown }).gmv_paid_brl_last_30d ?? 0) || 0,
    paidOrdersLast30d: Number((r as { paid_orders_last_30d?: unknown }).paid_orders_last_30d ?? 0) || 0,
    allOrdersLast30d: Number((r as { all_orders_last_30d?: unknown }).all_orders_last_30d ?? 0) || 0,
  }));
}

export type PlatformNewStoresWeekBucket = {
  weekStartIso: string;
  label: string;
  count: number;
};

function startOfUtcWeekMonday(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  x.setUTCDate(x.getUTCDate() - daysFromMonday);
  return x;
}

function weekLabelPt(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });
}

/** Contagem de `stores.created_at` por semana (UTC, semana a iniciar segunda) — gráfico na Central. */
export async function getPlatformNewStoresByWeek(env: Env, weeks: number): Promise<PlatformNewStoresWeekBucket[]> {
  const w = Math.min(52, Math.max(1, Math.trunc(weeks)));
  const supabase = getSupabase(env);
  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - w * 7);

  const { data, error } = await supabase
    .from("stores")
    .select("created_at")
    .gte("created_at", rangeStart.toISOString());

  if (error) {
    if (isMissingRelation(error)) return [];
    throw new Error(error.message);
  }

  const countByWeek = new Map<string, number>();
  for (const row of data ?? []) {
    const raw = (row as { created_at?: string | null }).created_at;
    if (!raw) continue;
    const c = new Date(raw);
    if (Number.isNaN(c.getTime())) continue;
    const key = startOfUtcWeekMonday(c).toISOString().slice(0, 10);
    countByWeek.set(key, (countByWeek.get(key) ?? 0) + 1);
  }

  const out: PlatformNewStoresWeekBucket[] = [];
  let cur = startOfUtcWeekMonday(new Date(rangeStart));
  const end = startOfUtcWeekMonday(now);
  while (cur <= end) {
    const key = cur.toISOString().slice(0, 10);
    out.push({
      weekStartIso: key,
      label: weekLabelPt(key),
      count: countByWeek.get(key) ?? 0,
    });
    cur = new Date(cur);
    cur.setUTCDate(cur.getUTCDate() + 7);
  }
  return out;
}
