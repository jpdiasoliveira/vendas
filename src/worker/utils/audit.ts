/**
 * Auditoria: grava ações do admin na tabela audit_logs (Supabase).
 * Só deve ser chamado após a operação principal ter sucesso.
 */

import { getSupabase } from "../core/supabase.js";
import type { AuthUser } from "../types.js";
import type { Store } from "../core/schema.js";

export type AuditContext = {
  env: Env;
  get: (key: "user" | "store") => unknown;
};

/**
 * Registra uma ação na tabela audit_logs (user_id e store_id do contexto Hono).
 * Falhas na gravação são logadas e não propagadas para não afetar a resposta da API.
 */
export async function logAction(
  c: AuditContext,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, unknown>
): Promise<void> {
  const user = c.get("user") as AuthUser | undefined;
  const store = c.get("store") as Store | undefined;
  const userId = user?.id;
  const storeId = store?.id;
  if (!userId || !storeId) return;

  try {
    const supabase = getSupabase(c.env);
    const { error } = await supabase.from("audit_logs").insert({
      user_id: userId,
      store_id: storeId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details ?? null,
      created_at: new Date().toISOString(),
    });
    if (error) console.error("audit.logAction failed:", action, resourceId, error.message);
  } catch (err) {
    console.error("audit.logAction failed:", action, resourceId, err);
  }
}
