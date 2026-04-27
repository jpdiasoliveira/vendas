-- =============================================================================
-- audit_logs: user_id opcional (eventos de pagamento sem usuário Supabase)
-- =============================================================================
-- Execute no SQL Editor do Supabase após o schema SaaS v1.
-- Permite registrar IPN do Mercado Pago e tentativas de checkout visitante
-- com actor nos `details` e user_id NULL.
-- =============================================================================

ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

ALTER TABLE public.audit_logs
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;

COMMENT ON COLUMN public.audit_logs.user_id IS
  'Usuário Supabase que executou a ação no painel; NULL para automação (ex.: webhook MP) ou fluxo sem login.';
