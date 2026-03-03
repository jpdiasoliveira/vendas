-- =============================================================================
-- Cole estes comandos no SQL Editor do Supabase e rode um por vez (ou em blocos).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) VERIFICAR SE O HISTÓRICO (AUDITORIA) EXISTE
-- -----------------------------------------------------------------------------
-- Verifica se a tabela audit_logs existe e quais colunas tem:
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- Verifica se a view view_audit_report existe e quais colunas tem:
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'view_audit_report'
ORDER BY ordinal_position;

-- Se as consultas acima não retornarem linhas, a tabela/view não existe.
-- Nesse caso, execute o script: docs/supabase-audit-logs.sql


-- -----------------------------------------------------------------------------
-- 2) LISTAR TODAS AS TABELAS E COLUNAS (para padronizar nomes e te orientar)
-- -----------------------------------------------------------------------------
-- Rode isto e copie o resultado (ou exporte CSV) para mandar pro dev.
-- Mostra: schema | tabela | coluna | tipo | nullable
SELECT
  c.table_schema AS schema_name,
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable
FROM information_schema.columns c
WHERE c.table_schema IN ('public', 'auth')
  AND c.table_name IN (
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  )
   OR (c.table_schema = 'auth' AND c.table_name = 'users')
ORDER BY c.table_schema, c.table_name, c.ordinal_position;


-- -----------------------------------------------------------------------------
-- 2b) Versão mais simples: só schema public (suas tabelas)
-- -----------------------------------------------------------------------------
SELECT
  table_name AS tabela,
  column_name AS coluna,
  data_type AS tipo,
  is_nullable AS aceita_nulo
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
