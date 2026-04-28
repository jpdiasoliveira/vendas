-- =============================================================================
-- Plataforma (SaaS Master) — Bloco 2: Motor de direitos (features + entitlements)
-- =============================================================================
-- Catálogo tipado (`platform_features`) + vínculo por versão de preço
-- (`platform_plan_price_version_entitlements`). Remove o JSONB `entitlements`
-- de `platform_plan_price_versions` após popular as linhas relacionais.
--
-- Resolver: `resolve_store_entitlements(store_id)` — lógica de tempo/status no Bloco 3
-- (`docs/supabase-platform-subscriptions-lifecycle-block3.sql`). Reaplique se alterar.
-- Uso recomendado: Worker
-- com service_role (função SECURITY DEFINER; EXECUTE só service_role).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Catálogo de funcionalidades (inteiro vs boolean)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  value_kind text NOT NULL CHECK (value_kind IN ('integer', 'boolean')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_features_value_kind
  ON public.platform_features (value_kind);

CREATE INDEX IF NOT EXISTS idx_platform_features_sort
  ON public.platform_features (sort_order, id);

COMMENT ON TABLE public.platform_features IS
  'Funcionalidade ou limite da plataforma; value_kind define se usa int_value ou bool_value nas concessões.';

-- -----------------------------------------------------------------------------
-- 2) Concessões por versão de preço (substitui JSONB entitlements)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_plan_price_version_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_price_version_id uuid NOT NULL
    REFERENCES public.platform_plan_price_versions (id) ON DELETE CASCADE,
  feature_id uuid NOT NULL
    REFERENCES public.platform_features (id) ON DELETE RESTRICT,
  int_value bigint NULL,
  bool_value boolean NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_price_version_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_ppve_version
  ON public.platform_plan_price_version_entitlements (plan_price_version_id);

CREATE INDEX IF NOT EXISTS idx_platform_ppve_feature
  ON public.platform_plan_price_version_entitlements (feature_id);

COMMENT ON TABLE public.platform_plan_price_version_entitlements IS
  'Direitos daquela versão de preço; uma linha por feature. int_value NULL = sem teto (ilimitado) para kind integer.';

COMMENT ON COLUMN public.platform_plan_price_version_entitlements.int_value IS
  'Para value_kind=integer: limite numérico; NULL significa ilimitado.';

COMMENT ON COLUMN public.platform_plan_price_version_entitlements.bool_value IS
  'Para value_kind=boolean: concessão explícita true/false.';

-- -----------------------------------------------------------------------------
-- 3) Integridade de forma (valor alinhado ao tipo da feature)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.platform_plan_price_version_entitlements_enforce_shape()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vk text;
BEGIN
  SELECT f.value_kind INTO vk
  FROM public.platform_features f
  WHERE f.id = NEW.feature_id;

  IF vk IS NULL THEN
    RAISE EXCEPTION 'platform_plan_price_version_entitlements: feature_id % inexistente', NEW.feature_id;
  END IF;

  IF vk = 'integer' THEN
    IF NEW.bool_value IS NOT NULL THEN
      RAISE EXCEPTION 'Feature integer: bool_value deve ser NULL (feature_id=%)', NEW.feature_id;
    END IF;
    IF NEW.int_value IS NOT NULL AND NEW.int_value < 0 THEN
      RAISE EXCEPTION 'int_value negativo não permitido';
    END IF;
  ELSIF vk = 'boolean' THEN
    IF NEW.int_value IS NOT NULL THEN
      RAISE EXCEPTION 'Feature boolean: int_value deve ser NULL (feature_id=%)', NEW.feature_id;
    END IF;
    IF NEW.bool_value IS NULL THEN
      RAISE EXCEPTION 'Feature boolean requer bool_value true ou false';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_ppve_enforce_shape ON public.platform_plan_price_version_entitlements;
CREATE TRIGGER trg_platform_ppve_enforce_shape
  BEFORE INSERT OR UPDATE ON public.platform_plan_price_version_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.platform_plan_price_version_entitlements_enforce_shape();

-- -----------------------------------------------------------------------------
-- 4) Seed do catálogo de features (4 exemplos)
-- -----------------------------------------------------------------------------
INSERT INTO public.platform_features (code, display_name, description, value_kind, sort_order)
VALUES
  ('max_products', 'Produtos', 'Quantidade máxima de produtos cadastrados.', 'integer', 10),
  ('custom_domain', 'Domínio customizado', 'Permite associar domínio próprio à loja.', 'boolean', 20),
  ('advanced_analytics', 'Analytics avançado', 'Relatórios e painéis avançados.', 'boolean', 30),
  ('staff_members_limit', 'Membros da equipe', 'Quantidade de contas de staff.', 'integer', 40)
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5) Popular concessões nos 3 planos (version_seq = 1) + remover JSONB legado
-- -----------------------------------------------------------------------------
WITH feats AS (
  SELECT code, id FROM public.platform_features
  WHERE code IN ('max_products', 'custom_domain', 'advanced_analytics', 'staff_members_limit')
),
vers AS (
  SELECT d.slug, ppv.id AS version_id
  FROM public.platform_plan_price_versions ppv
  JOIN public.platform_plan_definitions d ON d.id = ppv.plan_definition_id
  WHERE ppv.version_seq = 1
    AND d.slug IN ('tier_base', 'tier_standard', 'tier_unlimited')
),
cells AS (
  SELECT
    v.version_id,
    f.id AS feature_id,
    f.code,
    CASE
      WHEN f.code = 'max_products' AND v.slug = 'tier_base' THEN 50::bigint
      WHEN f.code = 'max_products' AND v.slug = 'tier_standard' THEN 500::bigint
      WHEN f.code = 'max_products' AND v.slug = 'tier_unlimited' THEN NULL::bigint
      WHEN f.code = 'staff_members_limit' AND v.slug = 'tier_base' THEN 2::bigint
      WHEN f.code = 'staff_members_limit' AND v.slug = 'tier_standard' THEN 10::bigint
      WHEN f.code = 'staff_members_limit' AND v.slug = 'tier_unlimited' THEN NULL::bigint
      ELSE NULL::bigint
    END AS int_value,
    CASE
      WHEN f.code = 'custom_domain' AND v.slug = 'tier_base' THEN false
      WHEN f.code = 'custom_domain' AND v.slug IN ('tier_standard', 'tier_unlimited') THEN true
      WHEN f.code = 'advanced_analytics' AND v.slug IN ('tier_base', 'tier_standard') THEN false
      WHEN f.code = 'advanced_analytics' AND v.slug = 'tier_unlimited' THEN true
      ELSE NULL::boolean
    END AS bool_value
  FROM vers v
  CROSS JOIN feats f
)
INSERT INTO public.platform_plan_price_version_entitlements (
  plan_price_version_id,
  feature_id,
  int_value,
  bool_value
)
SELECT c.version_id, c.feature_id, c.int_value, c.bool_value
FROM cells c
ON CONFLICT (plan_price_version_id, feature_id) DO UPDATE SET
  int_value = EXCLUDED.int_value,
  bool_value = EXCLUDED.bool_value,
  updated_at = now();

ALTER TABLE public.platform_plan_price_versions
  DROP COLUMN IF EXISTS entitlements;

-- -----------------------------------------------------------------------------
-- 6) Resolver: benefícios da assinatura atual da loja
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_store_entitlements(p_store_id uuid)
RETURNS TABLE (
  feature_code text,
  value_kind text,
  int_value bigint,
  bool_value boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH sub AS (
    SELECT s.plan_price_version_id
    FROM public.platform_store_subscriptions s
    WHERE s.store_id = p_store_id
      AND s.ended_at IS NULL
      AND s.lifecycle_status IN ('trialing', 'active', 'past_due')
    ORDER BY s.started_at DESC
    LIMIT 1
  )
  SELECT f.code, f.value_kind, e.int_value, e.bool_value
  FROM sub
  JOIN public.platform_plan_price_version_entitlements e
    ON e.plan_price_version_id = sub.plan_price_version_id
  JOIN public.platform_features f ON f.id = e.feature_id;
$$;

COMMENT ON FUNCTION public.resolve_store_entitlements(uuid) IS
  'Retorna concessões ativas da loja conforme última assinatura não encerrada; chamar com service_role no Worker.';

REVOKE ALL ON FUNCTION public.resolve_store_entitlements(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_store_entitlements(uuid) TO service_role;

-- -----------------------------------------------------------------------------
-- 7) RLS + grants (catálogo legível; escrita só service_role)
-- -----------------------------------------------------------------------------
ALTER TABLE public.platform_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_plan_price_version_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_features_select_catalog ON public.platform_features;
CREATE POLICY platform_features_select_catalog
  ON public.platform_features
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS platform_ppve_select_public_offer ON public.platform_plan_price_version_entitlements;
CREATE POLICY platform_ppve_select_public_offer
  ON public.platform_plan_price_version_entitlements
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.platform_plan_price_versions v
      JOIN public.platform_plan_definitions d ON d.id = v.plan_definition_id
      WHERE v.id = platform_plan_price_version_entitlements.plan_price_version_id
        AND v.is_public_offer = true
        AND v.retired_at IS NULL
        AND d.status = 'published'
    )
  );

REVOKE ALL ON public.platform_features FROM PUBLIC;
GRANT SELECT ON public.platform_features TO anon, authenticated;
GRANT ALL ON public.platform_features TO service_role;

REVOKE ALL ON public.platform_plan_price_version_entitlements FROM PUBLIC;
GRANT SELECT ON public.platform_plan_price_version_entitlements TO anon, authenticated;
GRANT ALL ON public.platform_plan_price_version_entitlements TO service_role;