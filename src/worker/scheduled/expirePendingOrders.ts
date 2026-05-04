import { getSupabase } from "../core/supabase.js";
import { logServerError } from "../utils/safeApiError.js";

/** Resposta JSON da RPC `expire_old_orders`. */
export type ExpireOldOrdersResult = {
  processed?: number;
  stock_restores?: number;
  cutoff_utc?: string;
  min_age_minutes?: number;
  batch_limit?: number;
};

const clampInt = (n: number, min: number, max: number, fallback: number): number => {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
};

/**
 * Executa a RPC `expire_old_orders` (migrations/8.sql) com limites seguros.
 * Chamado pelo `scheduled` do Worker (Cloudflare Cron).
 */
export const runExpireOldOrders = async (env: Env): Promise<void> => {
  const minutesRaw = parseInt(String(env.ORDER_EXPIRE_PENDING_MINUTES ?? ""), 10);
  const batchRaw = parseInt(String(env.ORDER_EXPIRE_BATCH ?? ""), 10);
  const pMin = Number.isFinite(minutesRaw) && minutesRaw > 0 ? minutesRaw : 60;
  const pBatch = Number.isFinite(batchRaw) && batchRaw > 0 ? batchRaw : 100;
  const p_min_age_minutes = clampInt(pMin, 1, 525600, 60);
  const p_max_orders = clampInt(pBatch, 1, 5000, 100);

  const supabase = getSupabase(env);
  const { data, error } = await supabase.rpc("expire_old_orders", {
    p_min_age_minutes,
    p_max_orders,
  });

  if (error) {
    logServerError("scheduled.expire_old_orders.rpc", error);
    return;
  }

  const payload = (data ?? null) as ExpireOldOrdersResult | null;
  const processed = payload?.processed ?? 0;
  const restores = payload?.stock_restores ?? 0;
  console.log(
    `[scheduled.expire_old_orders] processed=${processed} stock_restores=${restores} min_age_min=${p_min_age_minutes} batch=${p_max_orders} raw=${JSON.stringify(data)}`
  );
};
