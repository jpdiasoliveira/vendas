import { PlatformFeatureCodes } from "../../constants/platformFeatureCodes.js";
import { getSubscriptionGraceDays } from "./db/platformRuntimeSettingsRepo.js";
import { getSupabase } from "./supabase.js";
import type { StoreCapabilities } from "../../contracts/schema.js";

type EntitlementRpcRow = {
  feature_code: string;
  value_kind: string;
  int_value: number | null;
  bool_value: boolean | null;
};

const EMPTY_CAPABILITIES: StoreCapabilities = {
  maxProducts: null,
  staffMembersLimit: null,
  customDomain: false,
  advancedAnalytics: false,
  hasActiveSubscription: false,
};

/** Assinatura existente mas sem direitos (suspended, cancelada, ou trial/período vencidos após a carência configurada). */
const LOCKED_CAPABILITIES: StoreCapabilities = {
  maxProducts: 0,
  staffMembersLimit: 0,
  customDomain: false,
  advancedAnalytics: false,
  hasActiveSubscription: false,
};

function mapRpcRowsToCapabilities(rows: EntitlementRpcRow[]): StoreCapabilities {
  if (!rows.length) return { ...EMPTY_CAPABILITIES };

  const byCode = new Map(rows.map((r) => [r.feature_code, r]));

  const intLimit = (code: string): number | null => {
    const r = byCode.get(code);
    if (!r || r.value_kind !== "integer") return null;
    if (r.int_value == null) return null;
    return Number(r.int_value);
  };

  const boolFlag = (code: string): boolean => byCode.get(code)?.bool_value === true;

  return {
    maxProducts: intLimit(PlatformFeatureCodes.maxProducts),
    staffMembersLimit: intLimit(PlatformFeatureCodes.staffMembersLimit),
    customDomain: boolFlag(PlatformFeatureCodes.customDomain),
    advancedAnalytics: boolFlag(PlatformFeatureCodes.advancedAnalytics),
    hasActiveSubscription: true,
  };
}

function parseTs(ms: string | null | undefined): number | null {
  if (ms == null || String(ms).trim() === "") return null;
  const t = new Date(ms).getTime();
  return Number.isFinite(t) ? t : null;
}

/**
 * Resolve direitos da loja via RPC `resolve_store_entitlements` (service role).
 * Sem assinatura: permissivo (EMPTY). Com assinatura suspensa/cancelada ou após carência
 * do fim do trial/período: LOCKED (alinhado ao SQL / `platform_runtime_settings`).
 */
export async function getStoreCapabilities(env: Env, storeId: string): Promise<StoreCapabilities> {
  const graceDays = await getSubscriptionGraceDays(env);
  const graceMs = graceDays * 24 * 60 * 60 * 1000;
  const supabase = getSupabase(env);
  const { data, error } = await supabase.rpc("resolve_store_entitlements", {
    p_store_id: storeId,
  });

  if (error) {
    console.error("[getStoreCapabilities] RPC resolve_store_entitlements:", error.message);
    throw new Error(error.message);
  }

  const rows = (Array.isArray(data) ? data : []) as EntitlementRpcRow[];
  if (rows.length > 0) {
    return mapRpcRowsToCapabilities(rows);
  }

  const { data: latest, error: subErr } = await supabase
    .from("platform_store_subscriptions")
    .select("lifecycle_status, trial_ends_at, current_period_end_at")
    .eq("store_id", storeId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subErr) {
    console.error("[getStoreCapabilities] subscription lookup:", subErr.message);
    return { ...EMPTY_CAPABILITIES };
  }

  if (!latest) {
    return { ...EMPTY_CAPABILITIES };
  }

  const status = String((latest as { lifecycle_status?: string }).lifecycle_status ?? "");
  if (status === "suspended" || status === "cancelled") {
    return { ...LOCKED_CAPABILITIES };
  }

  const now = Date.now();
  const trialEnd = parseTs((latest as { trial_ends_at?: string | null }).trial_ends_at ?? null);
  if (status === "trialing" && trialEnd != null && trialEnd + graceMs <= now) {
    return { ...LOCKED_CAPABILITIES };
  }

  const periodEnd = parseTs(
    (latest as { current_period_end_at?: string | null }).current_period_end_at ?? null
  );
  if (
    (status === "active" || status === "past_due") &&
    periodEnd != null &&
    periodEnd + graceMs <= now
  ) {
    return { ...LOCKED_CAPABILITIES };
  }

  return { ...EMPTY_CAPABILITIES };
}
