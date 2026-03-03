-- 1. Deleta a versão antiga que está dando conflito
DROP VIEW IF EXISTS view_audit_report;

-- 2. Cria a nova versão do zero com a estrutura correta
CREATE VIEW view_audit_report AS
SELECT
  a.id,
  a.store_id,
  a.user_id,
  a.action,
  a.action AS action_key,
  a.resource_type,
  a.resource_id,
  -- Mantendo o padrão que o seu componente React espera
  (a.resource_type || ' #' || COALESCE(a.resource_id, '')) AS nome_recurso,
  a.details,
  a.created_at,
  u.email AS user_email
FROM audit_logs a
LEFT JOIN auth.users u ON u.id = a.user_id;
