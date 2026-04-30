/**
 * Repositório: leitura de auditoria (view_audit_report), sempre .eq("store_id", storeId).
 */

import { getSupabase } from "../supabase.js";
import type { AuditLogReport } from "../../../shared/types.js";

export interface AuditReportRow {
  id: string;
  store_id: string;
  user_id: string;
  action: string;
  action_key: string;
  resource_type: string;
  resource_id: string;
  nome_recurso: string;
  details: Record<string, unknown> | null;
  created_at: string;
  user_email: string | null;
}

export async function getAuditLogsByStore(env: Env, storeId: string): Promise<AuditReportRow[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("view_audit_report")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (rows ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    store_id: row.store_id as string,
    user_id: row.user_id as string,
    action: row.action as string,
    action_key: (row.action_key as string) ?? (row.action as string),
    resource_type: row.resource_type as string,
    resource_id: row.resource_id as string,
    nome_recurso: (row.nome_recurso as string) ?? "",
    details: row.details as Record<string, unknown> | null,
    created_at: row.created_at as string,
    user_email: (row.user_email as string | null) ?? null,
  }));
}

const ACTION_LABELS: Record<string, string> = {
  CREATE_PRODUCT: "Criar produto",
  UPDATE_PRODUCT: "Atualizar produto",
  DELETE_PRODUCT: "Excluir produto",
  UPDATE_ORDER_STATUS: "Atualizar status do pedido",
  UPDATE_ORDER_TRACKING: "Atualizar rastreio do pedido",
  PAYMENT_INTENT_PIX: "Tentativa de pagamento PIX (Mercado Pago)",
  PAYMENT_INTENT_CHECKOUT_PRO: "Tentativa de checkout (preferência Mercado Pago)",
  MP_WEBHOOK_PAYMENT_NOTIFICATION: "Notificação Mercado Pago (webhook)",
  SYNC_ORDER_MP_PAYMENT: "Sincronizar pagamento com Mercado Pago (manual)",
  CREATE_CATEGORY: "Criar categoria",
  UPDATE_CATEGORY: "Atualizar categoria",
  DELETE_CATEGORY: "Excluir categoria",
};

export interface GetAuditLogsOptions {
  search?: string;
  /** Filtro por um único `action_key`. */
  action?: string;
  /** Filtro por vários `action_key` (ex.: chip Criação / Exclusão). Ignora `action` se definido. */
  actions?: string[];
}

export async function getAuditLogs(
  env: Env,
  storeId: string,
  options?: GetAuditLogsOptions
): Promise<AuditLogReport[]> {
  const supabase = getSupabase(env);
  let query = supabase
    .from("view_audit_report")
    .select("*")
    .eq("store_id", storeId);

  const search = options?.search?.trim();
  if (search) {
    query = query.ilike("nome_recurso", `%${search}%`);
  }
  const actionsList = (options?.actions ?? []).map((a) => a.trim()).filter(Boolean);
  if (actionsList.length > 0) {
    query = query.in("action_key", actionsList);
  } else if (options?.action?.trim()) {
    query = query.eq("action_key", options.action.trim());
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as AuditReportRow[];
  return rows.map((row) => ({
    id: row.id,
    data_hora: row.created_at,
    usuario_email: row.user_email ?? "",
    acao_descricao: ACTION_LABELS[row.action] ?? row.action,
    action_key: row.action,
    tipo: row.resource_type,
    nome_recurso: row.nome_recurso ?? `${row.resource_type} #${row.resource_id}`,
    resource_id: row.resource_id,
    detalhes: row.details ?? {},
  }));
}
