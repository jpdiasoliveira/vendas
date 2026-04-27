export type TransactionalTemplateId = "order_created" | "order_paid" | "order_shipped";

export interface TransactionalEmailPayload {
  /** Destinatário; null quando ainda não há e-mail conhecido (ex.: só audit). */
  to: string | null;
  subject: string;
  templateId: TransactionalTemplateId;
  context: Record<string, unknown>;
}
