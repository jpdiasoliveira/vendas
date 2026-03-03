-- Tabela audit_logs: registro de ações do painel admin (produtos, pedidos).
-- Usada pelo Worker em src/worker/utils/audit.ts (logAction).
-- Execute no SQL Editor do seu projeto Supabase.

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_store_id ON audit_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

COMMENT ON TABLE audit_logs IS 'Auditoria: ações do admin (CREATE_PRODUCT, UPDATE_PRODUCT, DELETE_PRODUCT, UPDATE_ORDER_STATUS).';

-- View para relatório de auditoria (Data/Hora, Usuário, Ação, Recurso). Usada por GET /api/admin/audit-logs.
-- nome_recurso e action_key permitem filtrar por search e action na API.
CREATE OR REPLACE VIEW view_audit_report AS
SELECT
  a.id,
  a.store_id,
  a.user_id,
  a.action,
  a.action AS action_key,
  a.resource_type,
  a.resource_id,
  (a.resource_type || ' #' || a.resource_id) AS nome_recurso,
  a.details,
  a.created_at,
  u.email AS user_email
FROM audit_logs a
LEFT JOIN auth.users u ON u.id = a.user_id;
