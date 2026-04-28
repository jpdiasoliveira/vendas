-- =============================================================================
-- Domínios customizados por loja (SaaS)
-- =============================================================================
-- Objetivo:
-- 1) mapear hostnames completos para uma loja (store_id)
-- 2) permitir resolução por domínio próprio no middleware de tenant
--
-- Ex.: lojaexemplo.com.br, www.lojaexemplo.com.br
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.store_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  domain text NOT NULL,
  status text NOT NULL DEFAULT 'pending_verification'
    CHECK (status IN ('pending_verification', 'active', 'disabled')),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (domain)
);

CREATE INDEX IF NOT EXISTS idx_store_domains_store_id ON public.store_domains(store_id);
CREATE INDEX IF NOT EXISTS idx_store_domains_status ON public.store_domains(status);

COMMENT ON TABLE public.store_domains IS
'Mapeia domínios customizados ao tenant (store_id).';

COMMENT ON COLUMN public.store_domains.domain IS
'Hostname canônico, sem protocolo e sem barra final. Ex.: lojaexemplo.com.br';

ALTER TABLE public.store_domains ENABLE ROW LEVEL SECURITY;

-- Tabela operacional de plataforma (back-end service_role). Bloqueia acesso direto por clientes.
DROP POLICY IF EXISTS "store_domains_service_only" ON public.store_domains;
CREATE POLICY "store_domains_service_only"
  ON public.store_domains
  FOR ALL
  USING (false)
  WITH CHECK (false);
