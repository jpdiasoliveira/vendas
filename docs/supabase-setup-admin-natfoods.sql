-- Configuração inicial: loja demo + primeiro admin.
-- Pré-requisito: executar docs/supabase-saas-multitenant-v1.sql (schema v1).
--
-- PASSO OBRIGATÓRIO antes de rodar no Supabase (SQL Editor):
-- No bloco DO abaixo, na linha "v_admin_email text := ...", coloque entre aspas simples
-- o MESMO e-mail de um usuário que já exista em: Authentication > Users.
-- Ex.: v_admin_email text := 'gabriel@seudominio.com';
--
-- (Se quiser criar só a loja + settings sem vincular admin, comente o bloco inteiro
-- do passo 3 com /* ... */ e execute; depois descomente, preencha o e-mail e rode de novo.)

-- 1) Loja de exemplo (tenant)
INSERT INTO stores (id, slug, display_name, status, created_at, updated_at)
VALUES (
  'a0000001-0001-0001-0001-000000000001',
  'natfoods',
  'Loja demo (SaaS)',
  'active',
  'free',
  '{}'::jsonb,
  now(),
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  status = 'active',
  updated_at = now();

-- 2) Linha de configurações (JSONB para regras/horários/tema no futuro)
INSERT INTO store_settings (store_id, public_profile, theme, business_rules, operating_hours, order_limits, created_at, updated_at)
VALUES (
  'a0000001-0001-0001-0001-000000000001',
  '{}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
)
ON CONFLICT (store_id) DO UPDATE SET updated_at = now();

-- 3) Membro admin: resolve user_id a partir do e-mail em auth.users (sem risco de UUID inválido)
DO $$
DECLARE
  -- Nomeie variáveis com prefixo v_ para não colidir com colunas em ON CONFLICT (erro 42702).
  v_admin_email text := '';  -- << preencha: 'seu-email@dominio.com' (usuário já criado em Authentication)
  v_admin_id uuid;
  v_store_id uuid := 'a0000001-0001-0001-0001-000000000001';
BEGIN
  IF trim(v_admin_email) = '' THEN
    RAISE EXCEPTION
      'Preencha v_admin_email no script (DECLARE dentro do passo 3): use aspas simples com o e-mail exato de Authentication > Users, salve o arquivo e execute de novo. Ex.: v_admin_email text := ''voce@email.com'';';
  END IF;

  SELECT u.id INTO v_admin_id
  FROM auth.users u
  WHERE lower(trim(u.email)) = lower(trim(v_admin_email))
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION
      'Nenhum usuário em auth.users com o e-mail "%". Verifique o cadastro em Authentication > Users.',
      v_admin_email;
  END IF;

  INSERT INTO store_members (user_id, store_id, role, created_at, updated_at)
  VALUES (v_admin_id, v_store_id, 'admin', now(), now())
  ON CONFLICT (store_id, user_id) DO UPDATE SET
    role = 'admin',
    updated_at = now();
END;
$$;

-- =============================================================================
-- Sobre "Success. No rows returned" no SQL Editor do Supabase
-- =============================================================================
-- É normal: INSERT ... ON CONFLICT e o bloco DO $$ não devolvem conjunto de linhas.
-- Se não houve mensagem de erro, os passos 1–3 foram aplicados.
--
-- 4) Conferência — ao rodar estas linhas (só elas ou o arquivo inteiro), você deve ver linhas:
-- =============================================================================

SELECT id, slug, display_name, status
FROM public.stores
WHERE slug = 'natfoods';

SELECT store_id, updated_at
FROM public.store_settings
WHERE store_id = 'a0000001-0001-0001-0001-000000000001';

SELECT sm.store_id, sm.user_id, sm.role, u.email AS auth_email
FROM public.store_members sm
LEFT JOIN auth.users u ON u.id = sm.user_id
WHERE sm.store_id = 'a0000001-0001-0001-0001-000000000001';
