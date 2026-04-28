-- =============================================================================
-- Plataforma (SaaS Master) — Bloco 3: ciclo de vida e assinaturas
-- =============================================================================
-- - Enum platform_subscription_lifecycle_status + colunas de tempo
-- - Histórico append-only: platform_store_subscription_lifecycle_events
-- - Função platform_suspend_expired_store_subscriptions + agendamento pg_cron (opcional)
-- - resolve_store_entitlements: benefícios só se status e janelas de tempo válidos
-- - Seed: 3 lojas demo (trial válido, ativa, suspensa)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Enum + colunas de tempo em platform_store_subscriptions
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_subscription_lifecycle_status') THEN
    CREATE TYPE public.platform_subscription_lifecycle_status AS ENUM (
      'trialing',
      'active',
      'past_due',
      'suspended',
      'cancelled'
    );
  END IF;
END
$$;

ALTER TABLE public.platform_store_subscriptions
  DROP CONSTRAINT IF EXISTS platform_store_subscriptions_lifecycle_status_check;

ALTER TABLE public.platform_store_subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz NULL;

ALTER TABLE public.platform_store_subscriptions
  ADD COLUMN IF NOT EXISTS current_period_start_at timestamptz NULL;

ALTER TABLE public.platform_store_subscriptions
  ADD COLUMN IF NOT EXISTS current_period_end_at timestamptz NULL;

COMMENT ON COLUMN public.platform_store_subscriptions.started_at IS
  'Início da vigência desta linha de assinatura.';

COMMENT ON COLUMN public.platform_store_subscriptions.trial_ends_at IS
  'Fim do trial; após esta data o job pode suspender se ainda em trialing.';

COMMENT ON COLUMN public.platform_store_subscriptions.current_period_start_at IS
  'Início do período de faturação atual (opcional).';

COMMENT ON COLUMN public.platform_store_subscriptions.current_period_end_at IS
  'Fim do período pago atual; vencido aciona suspensão automática (job).';

COMMENT ON COLUMN public.platform_store_subscriptions.ended_at IS
  'Preenchido quando a linha deixa de ser a assinatura corrente.';

-- Índice parcial antigo compara lifecycle_status a text[] — remover antes de mudar o tipo.
DROP INDEX IF EXISTS public.idx_platform_store_subscriptions_active_store;

DO $$
DECLARE
  col_data_type text;
BEGIN
  SELECT c.data_type INTO col_data_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'platform_store_subscriptions'
    AND c.column_name = 'lifecycle_status';

  IF col_data_type IN ('text', 'character varying') THEN
    ALTER TABLE public.platform_store_subscriptions ALTER COLUMN lifecycle_status DROP DEFAULT;
    ALTER TABLE public.platform_store_subscriptions
      ALTER COLUMN lifecycle_status TYPE public.platform_subscription_lifecycle_status
      USING (
        CASE lower(trim(cast(lifecycle_status as text)))
          WHEN 'trialing' THEN 'trialing'::public.platform_subscription_lifecycle_status
          WHEN 'active' THEN 'active'::public.platform_subscription_lifecycle_status
          WHEN 'past_due' THEN 'past_due'::public.platform_subscription_lifecycle_status
          WHEN 'suspended' THEN 'suspended'::public.platform_subscription_lifecycle_status
          WHEN 'cancelled' THEN 'cancelled'::public.platform_subscription_lifecycle_status
          ELSE 'active'::public.platform_subscription_lifecycle_status
        END
      );
    ALTER TABLE public.platform_store_subscriptions
      ALTER COLUMN lifecycle_status SET DEFAULT 'active'::public.platform_subscription_lifecycle_status;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_platform_store_subscriptions_active_store
  ON public.platform_store_subscriptions (store_id)
  WHERE ended_at IS NULL
    AND lifecycle_status IN (
      'trialing'::public.platform_subscription_lifecycle_status,
      'active'::public.platform_subscription_lifecycle_status,
      'past_due'::public.platform_subscription_lifecycle_status
    );

-- -----------------------------------------------------------------------------
-- 1b) Config global da plataforma (operador): carência de assinatura (dias)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_runtime_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  subscription_grace_days integer NOT NULL DEFAULT 7
    CHECK (subscription_grace_days >= 0 AND subscription_grace_days <= 90),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_runtime_settings (id, subscription_grace_days)
VALUES (1, 7)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.platform_runtime_settings IS
  'Parâmetros globais da plataforma (singleton id=1). Editável pelo operador via Worker.';

ALTER TABLE public.platform_runtime_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_runtime_settings_deny_public ON public.platform_runtime_settings;
CREATE POLICY platform_runtime_settings_deny_public
  ON public.platform_runtime_settings
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

REVOKE ALL ON public.platform_runtime_settings FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.platform_runtime_settings TO service_role;

CREATE OR REPLACE FUNCTION public.platform_subscription_grace_interval()
RETURNS interval
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT subscription_grace_days FROM public.platform_runtime_settings WHERE id = 1),
    7
  ) * interval '1 day';
$$;

COMMENT ON FUNCTION public.platform_subscription_grace_interval() IS
  'Intervalo de carência (dias configuráveis em platform_runtime_settings) para trial e período pago.';

REVOKE ALL ON FUNCTION public.platform_subscription_grace_interval() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.platform_subscription_grace_interval() TO service_role;

-- -----------------------------------------------------------------------------
-- 2) Histórico append-only
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_store_subscription_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.platform_store_subscriptions (id) ON DELETE SET NULL,
  event_kind text NOT NULL
    CHECK (event_kind IN (
      'subscription_created',
      'lifecycle_status_changed',
      'plan_price_version_changed',
      'trial_started',
      'trial_ended',
      'period_renewed',
      'payment_failed',
      'auto_suspended',
      'resumed',
      'cancelled',
      'note'
    )),
  from_lifecycle_status text NULL,
  to_lifecycle_status text NULL,
  from_plan_price_version_id uuid NULL REFERENCES public.platform_plan_price_versions (id) ON DELETE SET NULL,
  to_plan_price_version_id uuid NULL REFERENCES public.platform_plan_price_versions (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor text NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_sub_lifecycle_events_store_time
  ON public.platform_store_subscription_lifecycle_events (store_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_sub_lifecycle_events_subscription
  ON public.platform_store_subscription_lifecycle_events (subscription_id);

COMMENT ON TABLE public.platform_store_subscription_lifecycle_events IS
  'Trilha append-only de mudanças de plano/status; não atualizar nem apagar linhas.';

REVOKE UPDATE, DELETE ON public.platform_store_subscription_lifecycle_events FROM PUBLIC;
REVOKE UPDATE, DELETE ON public.platform_store_subscription_lifecycle_events FROM service_role;

ALTER TABLE public.platform_store_subscription_lifecycle_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_sub_lifecycle_events_deny_all ON public.platform_store_subscription_lifecycle_events;
CREATE POLICY platform_sub_lifecycle_events_deny_all
  ON public.platform_store_subscription_lifecycle_events
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

REVOKE ALL ON public.platform_store_subscription_lifecycle_events FROM PUBLIC;
GRANT SELECT, INSERT ON public.platform_store_subscription_lifecycle_events TO service_role;

-- -----------------------------------------------------------------------------
-- 3) Trigger de auditoria em assinaturas
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.platform_store_subscriptions_append_lifecycle_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.platform_store_subscription_lifecycle_events (
      store_id,
      subscription_id,
      event_kind,
      to_lifecycle_status,
      to_plan_price_version_id,
      metadata
    )
    VALUES (
      NEW.store_id,
      NEW.id,
      'subscription_created',
      NEW.lifecycle_status::text,
      NEW.plan_price_version_id,
      jsonb_build_object('started_at', NEW.started_at, 'trial_ends_at', NEW.trial_ends_at, 'current_period_end_at', NEW.current_period_end_at)
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.lifecycle_status IS DISTINCT FROM NEW.lifecycle_status THEN
      INSERT INTO public.platform_store_subscription_lifecycle_events (
        store_id,
        subscription_id,
        event_kind,
        from_lifecycle_status,
        to_lifecycle_status,
        metadata
      )
      VALUES (
        NEW.store_id,
        NEW.id,
        'lifecycle_status_changed',
        OLD.lifecycle_status::text,
        NEW.lifecycle_status::text,
        jsonb_build_object('updated_at', NEW.updated_at)
      );
    END IF;

    IF OLD.plan_price_version_id IS DISTINCT FROM NEW.plan_price_version_id THEN
      INSERT INTO public.platform_store_subscription_lifecycle_events (
        store_id,
        subscription_id,
        event_kind,
        from_plan_price_version_id,
        to_plan_price_version_id,
        metadata
      )
      VALUES (
        NEW.store_id,
        NEW.id,
        'plan_price_version_changed',
        OLD.plan_price_version_id,
        NEW.plan_price_version_id,
        '{}'::jsonb
      );
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_store_subscriptions_lifecycle_log ON public.platform_store_subscriptions;
CREATE TRIGGER trg_platform_store_subscriptions_lifecycle_log
  AFTER INSERT OR UPDATE ON public.platform_store_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.platform_store_subscriptions_append_lifecycle_event();

-- -----------------------------------------------------------------------------
-- 4) Suspensão automática (7 dias de carência após fim do trial ou do período)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.platform_suspend_expired_store_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int;
BEGIN
  WITH candidates AS (
    SELECT s.id
    FROM public.platform_store_subscriptions s
    WHERE s.ended_at IS NULL
      AND s.lifecycle_status IN (
        'trialing'::public.platform_subscription_lifecycle_status,
        'active'::public.platform_subscription_lifecycle_status,
        'past_due'::public.platform_subscription_lifecycle_status
      )
      AND (
        (
          s.lifecycle_status = 'trialing'::public.platform_subscription_lifecycle_status
          AND s.trial_ends_at IS NOT NULL
          AND s.trial_ends_at + public.platform_subscription_grace_interval() < now()
        )
        OR (
          s.lifecycle_status IN (
            'active'::public.platform_subscription_lifecycle_status,
            'past_due'::public.platform_subscription_lifecycle_status
          )
          AND s.current_period_end_at IS NOT NULL
          AND s.current_period_end_at + public.platform_subscription_grace_interval() < now()
        )
      )
  ),
  upd AS (
    UPDATE public.platform_store_subscriptions s
    SET
      lifecycle_status = 'suspended'::public.platform_subscription_lifecycle_status,
      updated_at = now()
    FROM candidates c
    WHERE s.id = c.id
    RETURNING s.id
  )
  SELECT count(*)::int FROM upd INTO n;

  RETURN coalesce(n, 0);
END;
$$;

COMMENT ON FUNCTION public.platform_suspend_expired_store_subscriptions() IS
  'Marca como suspended após carência (subscription_grace_days) desde trial_ends_at ou current_period_end_at. Agendar com pg_cron.';

REVOKE ALL ON FUNCTION public.platform_suspend_expired_store_subscriptions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.platform_suspend_expired_store_subscriptions() TO service_role;

-- Agendamento (só se pg_cron existir — Supabase: Database → Extensions)
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('platform_suspend_expired_store_subscriptions');
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
    BEGIN
      PERFORM cron.schedule(
        'platform_suspend_expired_store_subscriptions',
        '15 * * * *',
        'SELECT public.platform_suspend_expired_store_subscriptions();'
      );
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END IF;
END
$cron$;

-- -----------------------------------------------------------------------------
-- 5) Resolver de direitos: respeita status + datas (suspended/cancelled = sem linhas)
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
  WITH latest AS (
    SELECT s.*
    FROM public.platform_store_subscriptions s
    WHERE s.store_id = p_store_id
      AND s.ended_at IS NULL
    ORDER BY s.started_at DESC
    LIMIT 1
  ),
  eligible AS (
    SELECT l.plan_price_version_id
    FROM latest l
    WHERE l.lifecycle_status IN (
      'trialing'::public.platform_subscription_lifecycle_status,
      'active'::public.platform_subscription_lifecycle_status,
      'past_due'::public.platform_subscription_lifecycle_status
    )
      AND (
        l.lifecycle_status <> 'trialing'::public.platform_subscription_lifecycle_status
        OR l.trial_ends_at IS NULL
        OR l.trial_ends_at + public.platform_subscription_grace_interval() > now()
      )
      AND (
        l.lifecycle_status NOT IN (
          'active'::public.platform_subscription_lifecycle_status,
          'past_due'::public.platform_subscription_lifecycle_status
        )
        OR l.current_period_end_at IS NULL
        OR l.current_period_end_at + public.platform_subscription_grace_interval() > now()
      )
  )
  SELECT f.code, f.value_kind, e.int_value, e.bool_value
  FROM eligible sub
  JOIN public.platform_plan_price_version_entitlements e ON e.plan_price_version_id = sub.plan_price_version_id
  JOIN public.platform_features f ON f.id = e.feature_id;
$$;

COMMENT ON FUNCTION public.resolve_store_entitlements(uuid) IS
  'Concessões da assinatura corrente: ignora suspended/cancelled; trial/período com carência (platform_runtime_settings) antes de cortar benefícios.';

REVOKE ALL ON FUNCTION public.resolve_store_entitlements(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_store_entitlements(uuid) TO service_role;

-- -----------------------------------------------------------------------------
-- 6) Seed — 3 lojas de teste (trial válido, ativa, suspensa)
-- -----------------------------------------------------------------------------
DELETE FROM public.platform_store_subscription_lifecycle_events
WHERE store_id IN (
  'c0e10000-0001-4001-8001-000000000001'::uuid,
  'c0e10000-0002-4001-8001-000000000002'::uuid,
  'c0e10000-0003-4001-8001-000000000003'::uuid
);

DELETE FROM public.platform_store_subscriptions
WHERE store_id IN (
  'c0e10000-0001-4001-8001-000000000001'::uuid,
  'c0e10000-0002-4001-8001-000000000002'::uuid,
  'c0e10000-0003-4001-8001-000000000003'::uuid
);

INSERT INTO public.stores (id, slug, display_name, status, created_at, updated_at)
SELECT * FROM (VALUES
  ('c0e10000-0001-4001-8001-000000000001'::uuid, 'demo-lifecycle-trial'::text, 'Demo Ciclo Trial'::text, 'active'::text, now(), now()),
  ('c0e10000-0002-4001-8001-000000000002'::uuid, 'demo-lifecycle-active'::text, 'Demo Ciclo Ativa'::text, 'active'::text, now(), now()),
  ('c0e10000-0003-4001-8001-000000000003'::uuid, 'demo-lifecycle-suspended'::text, 'Demo Ciclo Suspensa'::text, 'active'::text, now(), now())
) AS t(id, slug, display_name, status, created_at, updated_at)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.store_settings (store_id, public_profile, theme, business_rules, operating_hours, order_limits, created_at, updated_at)
VALUES
  ('c0e10000-0001-4001-8001-000000000001', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('c0e10000-0002-4001-8001-000000000002', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('c0e10000-0003-4001-8001-000000000003', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, now(), now())
ON CONFLICT (store_id) DO UPDATE SET updated_at = now();

INSERT INTO public.platform_store_subscriptions (
  id,
  store_id,
  plan_price_version_id,
  lifecycle_status,
  started_at,
  ended_at,
  trial_ends_at,
  current_period_start_at,
  current_period_end_at,
  created_at,
  updated_at
)
SELECT
  x.id,
  x.store_id,
  v.version_id,
  x.lifecycle_status::public.platform_subscription_lifecycle_status,
  x.started_at,
  NULL::timestamptz,
  x.trial_ends_at,
  x.current_period_start_at,
  x.current_period_end_at,
  now(),
  now()
FROM (
  VALUES
    (
      'd0f10000-0001-4001-8001-000000000001'::uuid,
      'c0e10000-0001-4001-8001-000000000001'::uuid,
      'trialing'::text,
      now() - interval '2 days',
      now() + interval '12 days',
      NULL::timestamptz,
      NULL::timestamptz
    ),
    (
      'd0f10000-0002-4001-8001-000000000002'::uuid,
      'c0e10000-0002-4001-8001-000000000002'::uuid,
      'active'::text,
      now() - interval '30 days',
      NULL::timestamptz,
      now() - interval '30 days',
      now() + interval '30 days'
    ),
    (
      'd0f10000-0003-4001-8001-000000000003'::uuid,
      'c0e10000-0003-4001-8001-000000000003'::uuid,
      'suspended'::text,
      now() - interval '90 days',
      NULL::timestamptz,
      now() - interval '80 days',
      now() - interval '10 days'
    )
) AS x(id, store_id, lifecycle_status, started_at, trial_ends_at, current_period_start_at, current_period_end_at)
CROSS JOIN (
  SELECT ppv.id AS version_id
  FROM public.platform_plan_price_versions ppv
  JOIN public.platform_plan_definitions d ON d.id = ppv.plan_definition_id
  WHERE ppv.version_seq = 1 AND d.slug = 'tier_standard'
  LIMIT 1
) v
ON CONFLICT (id) DO UPDATE SET
  plan_price_version_id = EXCLUDED.plan_price_version_id,
  lifecycle_status = EXCLUDED.lifecycle_status,
  trial_ends_at = EXCLUDED.trial_ends_at,
  current_period_start_at = EXCLUDED.current_period_start_at,
  current_period_end_at = EXCLUDED.current_period_end_at,
  updated_at = now();
