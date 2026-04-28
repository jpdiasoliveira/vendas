-- =============================================================================
-- Plataforma (SaaS Master): catálogo de planos + versões de precificação
-- =============================================================================
-- Separa identidade comercial (`platform_plan_definitions`) de regras e valores
-- versionados (`platform_plan_price_versions`). Assinaturas ativas referenciam
-- uma versão concreta — alterar preço cria nova linha, não reescreve histórico.
--
-- RLS: leitura pública apenas do que estiver publicado; escrita só service_role.
-- Execute no SQL Editor ou via migração MCP.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Identidade comercial do plano (slug estável, texto de vitrine)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_plan_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  summary text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_plan_definitions_status
  ON public.platform_plan_definitions (status);

CREATE INDEX IF NOT EXISTS idx_platform_plan_definitions_published_catalog
  ON public.platform_plan_definitions (sort_order, id)
  WHERE status = 'published';

COMMENT ON TABLE public.platform_plan_definitions IS
  'Pacote comercial da plataforma (identidade): slug e copy; precificação fica nas versões.';

-- -----------------------------------------------------------------------------
-- 2) Versão de precificação / ciclo / trial (imutável para assinantes existentes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_plan_price_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_definition_id uuid NOT NULL
    REFERENCES public.platform_plan_definitions (id) ON DELETE RESTRICT,
  version_seq integer NOT NULL CHECK (version_seq > 0),
  billing_interval text NOT NULL DEFAULT 'monthly'
    CHECK (billing_interval IN ('monthly', 'yearly')),
  unit_amount_cents bigint NOT NULL CHECK (unit_amount_cents >= 0),
  currency text NOT NULL DEFAULT 'BRL' CHECK (char_length(currency) = 3),
  trial_period_days integer NOT NULL DEFAULT 0 CHECK (trial_period_days >= 0 AND trial_period_days <= 365),
  is_public_offer boolean NOT NULL DEFAULT true,
  effective_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_definition_id, version_seq)
);

CREATE INDEX IF NOT EXISTS idx_platform_plan_price_versions_definition
  ON public.platform_plan_price_versions (plan_definition_id);

CREATE INDEX IF NOT EXISTS idx_platform_plan_price_versions_public_offer
  ON public.platform_plan_price_versions (plan_definition_id, effective_at DESC)
  WHERE is_public_offer = true AND retired_at IS NULL;

COMMENT ON TABLE public.platform_plan_price_versions IS
  'Snapshot de preço e regras por versão; novas assinaturas apontam para um id fixo.';

-- Direitos por versão: ver Bloco 2 (`platform_plan_price_version_entitlements`).

-- -----------------------------------------------------------------------------
-- 3) Vínculo loja ↔ versão contratada (integridade: não apagar versão em uso)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_store_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  plan_price_version_id uuid NOT NULL
    REFERENCES public.platform_plan_price_versions (id) ON DELETE RESTRICT,
  lifecycle_status text NOT NULL DEFAULT 'active'
    CHECK (lifecycle_status IN ('trialing', 'active', 'past_due', 'cancelled', 'suspended')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_store_subscriptions_store
  ON public.platform_store_subscriptions (store_id);

CREATE INDEX IF NOT EXISTS idx_platform_store_subscriptions_version
  ON public.platform_store_subscriptions (plan_price_version_id);

CREATE INDEX IF NOT EXISTS idx_platform_store_subscriptions_active_store
  ON public.platform_store_subscriptions (store_id)
  WHERE ended_at IS NULL AND lifecycle_status IN ('trialing', 'active', 'past_due');

COMMENT ON TABLE public.platform_store_subscriptions IS
  'Qual versão de plano a loja está usando; impede DROP da versão com ON DELETE RESTRICT. Ciclo de vida (enum, trial, período): ver Bloco 3.';

-- -----------------------------------------------------------------------------
-- 4) RLS + grants (leitura catálogo; escrita só service_role)
-- -----------------------------------------------------------------------------
ALTER TABLE public.platform_plan_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_plan_price_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_store_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_plan_definitions_select_public ON public.platform_plan_definitions;
CREATE POLICY platform_plan_definitions_select_public
  ON public.platform_plan_definitions
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS platform_plan_price_versions_select_public ON public.platform_plan_price_versions;
CREATE POLICY platform_plan_price_versions_select_public
  ON public.platform_plan_price_versions
  FOR SELECT
  TO anon, authenticated
  USING (
    is_public_offer = true
    AND retired_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.platform_plan_definitions d
      WHERE d.id = platform_plan_price_versions.plan_definition_id
        AND d.status = 'published'
    )
  );

-- Assinaturas: sem política para anon/authenticated → apenas service_role (via Worker).
-- Não criar política SELECT para público.

REVOKE ALL ON public.platform_plan_definitions FROM PUBLIC;
GRANT SELECT ON public.platform_plan_definitions TO anon, authenticated;
GRANT ALL ON public.platform_plan_definitions TO service_role;

REVOKE ALL ON public.platform_plan_price_versions FROM PUBLIC;
GRANT SELECT ON public.platform_plan_price_versions TO anon, authenticated;
GRANT ALL ON public.platform_plan_price_versions TO service_role;

REVOKE ALL ON public.platform_store_subscriptions FROM PUBLIC;
GRANT ALL ON public.platform_store_subscriptions TO service_role;

-- -----------------------------------------------------------------------------
-- 5) Seed: três níveis (base / standard / unlimited)
-- -----------------------------------------------------------------------------
INSERT INTO public.platform_plan_definitions (slug, display_name, summary, status, sort_order, published_at)
VALUES
  (
    'tier_base',
    'Base',
    'Entrada na plataforma com recursos essenciais.',
    'published',
    10,
    now()
  ),
  (
    'tier_standard',
    'Standard',
    'Operação em crescimento com mais capacidade.',
    'published',
    20,
    now()
  ),
  (
    'tier_unlimited',
    'Unlimited',
    'Operação ampla sem tetos operacionais padrão.',
    'published',
    30,
    now()
  )
ON CONFLICT (slug) DO NOTHING;

WITH defs AS (
  SELECT id, slug FROM public.platform_plan_definitions WHERE slug IN ('tier_base', 'tier_standard', 'tier_unlimited')
)
INSERT INTO public.platform_plan_price_versions (
  plan_definition_id,
  version_seq,
  billing_interval,
  unit_amount_cents,
  currency,
  trial_period_days,
  is_public_offer,
  effective_at
)
SELECT
  d.id,
  1,
  'monthly',
  v.cents,
  'BRL',
  v.trial,
  true,
  now()
FROM defs d
JOIN (
  VALUES
    ('tier_base', 0::bigint, 14),
    ('tier_standard', 9900::bigint, 14),
    ('tier_unlimited', 29900::bigint, 30)
) AS v(slug, cents, trial) ON v.slug = d.slug
ON CONFLICT (plan_definition_id, version_seq) DO NOTHING;
