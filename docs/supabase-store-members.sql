-- Tabela store_members: vincula usuários do Supabase Auth (auth.users) às lojas.
-- Permite controle de acesso multi-tenant ao painel admin (admin/editor).
-- Execute no SQL Editor do seu projeto Supabase.

-- Se a tabela já existir, não falhe (opcional).
-- CREATE TABLE IF NOT EXISTS store_members (...)

CREATE TABLE store_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id text NOT NULL,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);

-- Índices para consultas por user_id e store_id (usado no middleware de auth).
CREATE INDEX idx_store_members_user_id ON store_members(user_id);
CREATE INDEX idx_store_members_store_id ON store_members(store_id);
CREATE INDEX idx_store_members_user_store ON store_members(user_id, store_id);

-- RLS: apenas o backend (service_role) acessa; frontend não acessa esta tabela diretamente.
ALTER TABLE store_members ENABLE ROW LEVEL SECURITY;

-- Política restritiva: sem políticas de SELECT/INSERT para anon/authenticated;
-- o Worker usa service_role e ignora RLS.
CREATE POLICY "Service role only" ON store_members
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Comentário para documentação.
COMMENT ON TABLE store_members IS 'Membros da loja (SaaS): user_id do Auth vinculado ao store_id da loja; role admin ou editor.';
