-- Configuração inicial: loja Natfoods + seu usuário como admin.
-- Execute no SQL Editor do Supabase. ANTES: substitua SEU_USER_ID_AQUI pelo UUID do seu usuário (Authentication > Users > copie o ID).

-- 1) Garantir que a loja Natfoods existe (store_id usado abaixo)
INSERT INTO stores (id, slug, display_name, status, created_at, updated_at)
VALUES (
  'a0000001-0001-0001-0001-000000000001',
  'natfoods',
  'Natfoods - Chips da Amazônia',
  'active',
  now(),
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  status = 'active',
  updated_at = now();

-- 2) Vincular você à loja como admin (TROQUE SEU_USER_ID_AQUI pelo UUID do Authentication > Users)
INSERT INTO store_members (user_id, store_id, role, created_at, updated_at)
VALUES (
  'SEU_USER_ID_AQUI',
  'a0000001-0001-0001-0001-000000000001',
  'admin',
  now(),
  now()
)
ON CONFLICT (user_id, store_id) DO UPDATE SET
  role = 'admin',
  updated_at = now();
