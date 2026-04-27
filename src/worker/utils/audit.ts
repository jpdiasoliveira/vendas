/**
 * Auditoria: grava ações na tabela audit_logs (Supabase).
 * Só deve ser chamado após a operação principal ter sucesso (quando aplicável).
 */

import { getSupabase } from "../core/supabase.js";
import type { AuthUser } from "../types.js";
import type { Store } from "../core/schema.js";
import { redactSecrets } from "./safeApiError.js";

export type AuditContext = {
  env: Env;
  get: (key: "user" | "store") => unknown;
};

export type LogAuditEventParams = {
  storeId: string;
  /** Null para automação (webhook) ou fluxo sem usuário Supabase (ex.: guest). */
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceLabel?: string;
  details?: Record<string, unknown> | null;
};

/**
 * Insere uma linha em audit_logs. Falhas são logadas e não propagam.
 * Exige `docs/supabase-audit-logs-nullable-user-payment.sql` aplicado para user_id NULL.
 */
export const logAuditEvent = async (env: Env, params: LogAuditEventParams): Promise<void> => {
  const label =
    params.resourceLabel?.trim() ||
    `${params.resourceType} #${params.resourceId}`.slice(0, 500);

  try {
    const supabase = getSupabase(env);
    const row: Record<string, unknown> = {
      store_id: params.storeId,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      resource_label: label,
      details: params.details ?? null,
      created_at: new Date().toISOString(),
    };
    row.user_id = params.userId;

    const { error } = await supabase.from("audit_logs").insert(row);
    if (error) {
      console.error(
        "audit.logAuditEvent failed:",
        params.action,
        params.resourceId,
        redactSecrets(error.message)
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("audit.logAuditEvent failed:", params.action, params.resourceId, redactSecrets(msg));
  }
};

/**
 * Registra ação do painel admin (sempre com usuário e loja no contexto Hono).
 */
export const logAction = async (
  c: AuditContext,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, unknown>
): Promise<void> => {
  const user = c.get("user") as AuthUser | undefined;
  const store = c.get("store") as Store | undefined;
  const userId = user?.id;
  const storeId = store?.id;
  if (!userId || !storeId) return;

  await logAuditEvent(c.env, {
    storeId,
    userId,
    action,
    resourceType,
    resourceId,
    details: details ?? null,
  });
};
