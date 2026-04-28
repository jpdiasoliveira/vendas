-- =============================================================================
-- Plataforma (SaaS Master) — Bloco 4: Inteligência e rollups (Analytics Master)
-- =============================================================================
-- Pré-requisitos:
--   - Schema SaaS (stores, orders): docs/supabase-saas-multitenant-v1.sql
--   - Opcional mas recomendado: Bloco 3 (lojas demo de ciclo de vida) para o seed
--
-- Conteúdo:
--   1) Tabelas de fatos diários: analytics_store_daily, analytics_platform_daily
--   2) Funções idempotentes de refresh (batch noite) + exemplo pg_cron
--   3) Views para Super Admin: ranking GMV, saúde mensal (MRR estimado + churn)
--   4) Seed fictício (últimos 30 dias) nas 3 lojas demo do Bloco 3
--
-- Convenção de dia: UTC — (created_at AT TIME ZONE 'UTC')::date
-- GMV pago: pedidos com status IN ('paid','approved','shipped','delivered').
--
-- Aula (rollups vs materialized views):
--   Tabelas de agregação incrementais permitem UPSERT por dia/loja, backfill
--   parcial e leitura O(1) no dashboard sem bloquear REFRESH MATERIALIZED VIEW
--   (lock exclusivo, recomputo total). Em escala (ex.: 1M+ pedidos), o dashboard
--   lê só milhares de linhas diárias agregadas; o batch noturno paga o custo uma
--   vez, longe do tráfego de pico.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Tabelas de fatos (consolidado por dia)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.analytics_store_daily (
  store_id uuid NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  day date NOT NULL,
  order_count_total integer NOT NULL DEFAULT 0 CHECK (order_count_total >= 0),
  order_count_paid integer NOT NULL DEFAULT 0 CHECK (order_count_paid >= 0),
  order_count_cancelled integer NOT NULL DEFAULT 0 CHECK (order_count_cancelled >= 0),
  gmv_paid_brl numeric(16, 2) NOT NULL DEFAULT 0 CHECK (gmv_paid_brl >= 0),
  gmv_non_cancelled_brl numeric(16, 2) NOT NULL DEFAULT 0 CHECK (gmv_non_cancelled_brl >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (store_id, day)
);

CREATE INDEX IF NOT EXISTS idx_analytics_store_daily_day
  ON public.analytics_store_daily (day DESC);

COMMENT ON TABLE public.analytics_store_daily IS
  'Fato diário por loja (UTC): contagens e GMV derivados de orders; preenchido por refresh batch.';

CREATE TABLE IF NOT EXISTS public.analytics_platform_daily (
  day date NOT NULL PRIMARY KEY,
  new_stores_count integer NOT NULL DEFAULT 0 CHECK (new_stores_count >= 0),
  orders_paid_total integer NOT NULL DEFAULT 0 CHECK (orders_paid_total >= 0),
  orders_all_total integer NOT NULL DEFAULT 0 CHECK (orders_all_total >= 0),
  gmv_paid_brl numeric(18, 2) NOT NULL DEFAULT 0 CHECK (gmv_paid_brl >= 0),
  distinct_stores_with_orders integer NOT NULL DEFAULT 0 CHECK (distinct_stores_with_orders >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_platform_daily_day
  ON public.analytics_platform_daily (day DESC);

COMMENT ON TABLE public.analytics_platform_daily IS
  'Fato diário global (UTC): soma das lojas + novas lojas criadas no dia.';

-- RLS: operador via Worker (service_role); sem acesso público.
ALTER TABLE public.analytics_store_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_platform_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS analytics_store_daily_deny_public ON public.analytics_store_daily;
CREATE POLICY analytics_store_daily_deny_public
  ON public.analytics_store_daily
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS analytics_platform_daily_deny_public ON public.analytics_platform_daily;
CREATE POLICY analytics_platform_daily_deny_public
  ON public.analytics_platform_daily
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

REVOKE ALL ON public.analytics_store_daily FROM PUBLIC;
REVOKE ALL ON public.analytics_platform_daily FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_store_daily TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_platform_daily TO service_role;

-- -----------------------------------------------------------------------------
-- 2) População (estratégia batch idempotente — recomendado + pg_cron)
-- -----------------------------------------------------------------------------
-- Triggers em cada INSERT/UPDATE em orders escalariaam writes e complicariam
-- correções de status (ex.: pending → paid). O batch reprocessa o dia inteiro
-- e mantém números coerentes com a verdade transacional.

CREATE OR REPLACE FUNCTION public.refresh_analytics_store_daily(p_day date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.analytics_store_daily WHERE day = p_day;

  INSERT INTO public.analytics_store_daily (
    store_id,
    day,
    order_count_total,
    order_count_paid,
    order_count_cancelled,
    gmv_paid_brl,
    gmv_non_cancelled_brl,
    updated_at
  )
  SELECT
    o.store_id,
    p_day,
    count(*)::integer,
    count(*) FILTER (
      WHERE o.status IN ('paid', 'approved', 'shipped', 'delivered')
    )::integer,
    count(*) FILTER (WHERE o.status = 'cancelled')::integer,
    coalesce(
      sum(o.total) FILTER (
        WHERE o.status IN ('paid', 'approved', 'shipped', 'delivered')
      ),
      0
    ),
    coalesce(sum(o.total) FILTER (WHERE o.status <> 'cancelled'), 0),
    now()
  FROM public.orders o
  WHERE (o.created_at AT TIME ZONE 'UTC')::date = p_day
  GROUP BY o.store_id;
END;
$$;

COMMENT ON FUNCTION public.refresh_analytics_store_daily(date) IS
  'Recomputa fatos do dia (UTC) por loja a partir de public.orders; idempotente.';

CREATE OR REPLACE FUNCTION public.refresh_analytics_platform_daily(p_day date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_stores integer;
BEGIN
  SELECT count(*)::integer INTO v_new_stores
  FROM public.stores s
  WHERE (s.created_at AT TIME ZONE 'UTC')::date = p_day;

  DELETE FROM public.analytics_platform_daily WHERE day = p_day;

  INSERT INTO public.analytics_platform_daily (
    day,
    new_stores_count,
    orders_paid_total,
    orders_all_total,
    gmv_paid_brl,
    distinct_stores_with_orders,
    updated_at
  )
  SELECT
    p_day,
    v_new_stores,
    coalesce(sum(d.order_count_paid), 0)::integer,
    coalesce(sum(d.order_count_total), 0)::integer,
    coalesce(sum(d.gmv_paid_brl), 0),
    count(*) FILTER (WHERE d.order_count_total > 0)::integer,
    now()
  FROM public.analytics_store_daily d
  WHERE d.day = p_day;
END;
$$;

COMMENT ON FUNCTION public.refresh_analytics_platform_daily(date) IS
  'Agrega analytics_store_daily do dia + contagem de novas lojas (UTC).';

CREATE OR REPLACE FUNCTION public.refresh_analytics_daily_rollups(p_from date, p_to date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d date;
BEGIN
  IF p_from IS NULL OR p_to IS NULL OR p_from > p_to THEN
    RAISE EXCEPTION 'refresh_analytics_daily_rollups: intervalo de datas inválido';
  END IF;

  FOR d IN
    SELECT d::date
    FROM generate_series(p_from, p_to, interval '1 day') AS gs(d)
  LOOP
    PERFORM public.refresh_analytics_store_daily(d);
    PERFORM public.refresh_analytics_platform_daily(d);
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.refresh_analytics_daily_rollups(date, date) IS
  'Reprocessa loja+plataforma para cada dia no intervalo [p_from, p_to] (UTC).';

REVOKE ALL ON FUNCTION public.refresh_analytics_store_daily(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_analytics_platform_daily(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_analytics_daily_rollups(date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_analytics_store_daily(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_analytics_platform_daily(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_analytics_daily_rollups(date, date) TO service_role;

-- Exemplo pg_cron (ajuste o nome do job; requer extensão pg_cron):
-- SELECT cron.schedule(
--   'analytics-daily-rollups',
--   '5 7 * * *',
--   $$SELECT public.refresh_analytics_daily_rollups((current_date - 2), (current_date - 1))$$
-- );
-- Reprocessa D-2 e D-1 para absorver pedidos cruzando meia-noite UTC e correções tardias.

-- -----------------------------------------------------------------------------
-- 3) Views de suporte ao Super Admin
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.platform_view_admin_store_ranking_gmv AS
SELECT
  s.id AS store_id,
  s.slug,
  s.display_name,
  s.status AS store_status,
  coalesce(sum(d.gmv_paid_brl), 0) AS gmv_paid_brl_last_30d,
  coalesce(sum(d.order_count_paid), 0)::bigint AS paid_orders_last_30d,
  coalesce(sum(d.order_count_total), 0)::bigint AS all_orders_last_30d
FROM public.stores s
LEFT JOIN public.analytics_store_daily d
  ON d.store_id = s.id
 AND d.day >= ((timezone('UTC', now()))::date - interval '30 days')
GROUP BY s.id, s.slug, s.display_name, s.status
ORDER BY gmv_paid_brl_last_30d DESC, paid_orders_last_30d DESC;

COMMENT ON VIEW public.platform_view_admin_store_ranking_gmv IS
  'Ranking de lojas por GMV pago (últimos 30 dias UTC) sobre analytics_store_daily.';

-- MRR “na ponta”: assinaturas correntes (sem histórico de fechamento mensal).
CREATE OR REPLACE VIEW public.platform_view_admin_mrr_estimate_current AS
SELECT
  coalesce(
    sum(
      CASE
        WHEN ppv.billing_interval = 'monthly' THEN ppv.unit_amount_cents::numeric / 100.0
        WHEN ppv.billing_interval = 'yearly' THEN ppv.unit_amount_cents::numeric / 100.0 / 12.0
        ELSE 0
      END
    ),
    0
  ) AS mrr_brl_estimated,
  count(*) FILTER (
    WHERE pss.lifecycle_status::text IN ('trialing', 'active', 'past_due')
  )::bigint AS paying_or_trialing_subscription_rows
FROM public.platform_store_subscriptions pss
JOIN public.platform_plan_price_versions ppv ON ppv.id = pss.plan_price_version_id
WHERE pss.ended_at IS NULL;

COMMENT ON VIEW public.platform_view_admin_mrr_estimate_current IS
  'MRR mensal estimado (BRL) a partir de assinaturas abertas e preço da versão; yearly normalizado /12.';

-- Churn / movimento mensal a partir da trilha append-only (Bloco 3).
CREATE OR REPLACE VIEW public.platform_view_admin_subscription_health_monthly AS
SELECT
  date_trunc('month', e.occurred_at AT TIME ZONE 'UTC')::date AS month_utc,
  count(*) FILTER (WHERE e.event_kind = 'subscription_created')::bigint AS new_subscription_events,
  count(*) FILTER (
    WHERE e.event_kind = 'lifecycle_status_changed'
      AND e.to_lifecycle_status IN ('cancelled', 'suspended')
  )::bigint AS churn_or_suspension_events
FROM public.platform_store_subscription_lifecycle_events e
GROUP BY 1
ORDER BY 1 DESC;

COMMENT ON VIEW public.platform_view_admin_subscription_health_monthly IS
  'Série mensal (UTC): novas assinaturas registradas vs eventos de churn/suspensão na trilha.';

REVOKE ALL ON public.platform_view_admin_store_ranking_gmv FROM PUBLIC;
REVOKE ALL ON public.platform_view_admin_mrr_estimate_current FROM PUBLIC;
REVOKE ALL ON public.platform_view_admin_subscription_health_monthly FROM PUBLIC;
GRANT SELECT ON public.platform_view_admin_store_ranking_gmv TO service_role;
GRANT SELECT ON public.platform_view_admin_mrr_estimate_current TO service_role;
GRANT SELECT ON public.platform_view_admin_subscription_health_monthly TO service_role;

-- -----------------------------------------------------------------------------
-- 4) Seed analítico fictício (últimos 30 dias) — lojas demo Bloco 3
-- -----------------------------------------------------------------------------
-- UUIDs fixas do seed em docs/supabase-platform-subscriptions-lifecycle-block3.sql

INSERT INTO public.analytics_store_daily (
  store_id,
  day,
  order_count_total,
  order_count_paid,
  order_count_cancelled,
  gmv_paid_brl,
  gmv_non_cancelled_brl,
  updated_at
)
SELECT
  s.store_id,
  s.day,
  s.oc_total,
  s.oc_paid,
  s.oc_canc,
  s.gmv_paid::numeric(16, 2),
  s.gmv_nc::numeric(16, 2),
  now()
FROM (
  SELECT
    store_id,
    day,
    -- Números determinísticos mas variados por loja/dia (hash → int)
    (1 + (abs(hashtext(store_id::text || day::text)) % 12))::integer AS oc_total,
    (1 + (abs(hashtext('p' || store_id::text || day::text)) % 8))::integer AS oc_paid,
    (abs(hashtext('c' || store_id::text || day::text)) % 2)::integer AS oc_canc,
    (45.0 + (abs(hashtext('g' || store_id::text || day::text)) % 5000) / 10.0) * (1 + (hashtext(store_id::text) % 3)) AS gmv_paid,
    (50.0 + (abs(hashtext('n' || store_id::text || day::text)) % 5200) / 10.0) * (1 + (hashtext(store_id::text) % 3)) AS gmv_nc
  FROM (
    VALUES
      ('c0e10000-0001-4001-8001-000000000001'::uuid),
      ('c0e10000-0002-4001-8001-000000000002'::uuid),
      ('c0e10000-0003-4001-8001-000000000003'::uuid)
  ) AS stores(store_id)
  CROSS JOIN generate_series(
    ((timezone('UTC', now()))::date - 29),
    ((timezone('UTC', now()))::date),
    interval '1 day'
  ) AS cal(day)
) AS s
ON CONFLICT (store_id, day) DO UPDATE SET
  order_count_total = EXCLUDED.order_count_total,
  order_count_paid = EXCLUDED.order_count_paid,
  order_count_cancelled = EXCLUDED.order_count_cancelled,
  gmv_paid_brl = EXCLUDED.gmv_paid_brl,
  gmv_non_cancelled_brl = EXCLUDED.gmv_non_cancelled_brl,
  updated_at = EXCLUDED.updated_at;

-- Reconciliar fatos globais a partir do seed das lojas (mesmo intervalo).
DO $$
DECLARE
  d date;
BEGIN
  FOR d IN
    SELECT d::date
    FROM generate_series(
      ((timezone('UTC', now()))::date - 29),
      ((timezone('UTC', now()))::date),
      interval '1 day'
    ) AS gs(d)
  LOOP
    PERFORM public.refresh_analytics_platform_daily(d);
  END LOOP;
END $$;
