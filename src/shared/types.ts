/** Contrato do log de auditoria (relatório). */
export interface AuditLogReport {
  id: string;
  data_hora: string;
  usuario_email: string;
  acao_descricao: string;
  /** Chave técnica da ação (ex: UPDATE_PRODUCT) para montar frases amigáveis. */
  action_key?: string;
  tipo: string;
  nome_recurso: string;
  /** ID do recurso (ex: UUID) para fallback quando details não tem nome. */
  resource_id?: string;
  detalhes: unknown;
}

/**
 * Types shared between the client and server go here.
 *
 * For example, we can add zod schemas for API input validation, and derive types from them:
 *
 * export const TodoSchema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   completed: z.number().int(), // 0 or 1
 * })
 *
 * export type TodoType = z.infer<typeof TodoSchema>;
 *
 * (Re-importe zod quando for usar schemas aqui.)
 */
