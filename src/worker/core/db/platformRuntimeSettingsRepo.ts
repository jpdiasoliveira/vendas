/**
 * Parâmetros globais da plataforma (singleton `platform_runtime_settings.id = 1`).
 */

import { getSupabase } from "../supabase.js";

const DEFAULT_GRACE_DAYS = 7;
const MIN_GRACE = 0;
const MAX_GRACE = 90;

export async function getSubscriptionGraceDays(env: Env): Promise<number> {
  const supabase = getSupabase(env);
  const { data, error } = await supabase
    .from("platform_runtime_settings")
    .select("subscription_grace_days")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.warn("[getSubscriptionGraceDays]", error.message);
    return DEFAULT_GRACE_DAYS;
  }

  const raw = (data as { subscription_grace_days?: unknown } | null)?.subscription_grace_days;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_GRACE_DAYS;
  const d = Math.trunc(n);
  if (d < MIN_GRACE || d > MAX_GRACE) return DEFAULT_GRACE_DAYS;
  return d;
}

export async function upsertSubscriptionGraceDays(env: Env, days: number): Promise<number> {
  if (!Number.isFinite(days)) throw new Error("INVALID_GRACE_DAYS");
  const d = Math.trunc(days);
  if (d < MIN_GRACE || d > MAX_GRACE) throw new Error("INVALID_GRACE_DAYS");

  const supabase = getSupabase(env);
  const { data, error } = await supabase
    .from("platform_runtime_settings")
    .upsert(
      { id: 1, subscription_grace_days: d, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    )
    .select("subscription_grace_days")
    .single();

  if (error) throw new Error(error.message);
  const out = (data as { subscription_grace_days?: unknown })?.subscription_grace_days;
  const n = typeof out === "number" ? out : Number(out);
  if (!Number.isFinite(n)) throw new Error("INVALID_GRACE_DAYS");
  return Math.trunc(n);
}
