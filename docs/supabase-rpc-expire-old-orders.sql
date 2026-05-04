-- =============================================================================
-- RPC: expirar pedidos pending antigos (cancelamento + estoque)
-- =============================================================================
-- Aplicar no SQL Editor do Supabase (ou migração remota). Requer:
--   public.restore_stock_for_order (docs/supabase-rpc-restore-order-stock.sql).
-- =============================================================================

-- Job de expiração: pedidos `pending` antigos → `cancelled` + reposição atómica de estoque quando aplicável.
-- Requer: `public.restore_stock_for_order` (migrations/7.sql ou docs/supabase-rpc-restore-order-stock.sql).

CREATE OR REPLACE FUNCTION public.expire_old_orders(
  p_min_age_minutes integer DEFAULT 60,
  p_max_orders integer DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  o record;
  reserved boolean;
  processed int := 0;
  restocked int := 0;
  cutoff timestamptz;
BEGIN
  IF p_min_age_minutes IS NULL OR p_min_age_minutes < 1 THEN
    RAISE EXCEPTION 'expire_old_orders: p_min_age_minutes must be >= 1';
  END IF;
  IF p_min_age_minutes > 525600 THEN
    RAISE EXCEPTION 'expire_old_orders: p_min_age_minutes exceeds maximum (525600)';
  END IF;
  IF p_max_orders IS NULL OR p_max_orders < 1 THEN
    RAISE EXCEPTION 'expire_old_orders: p_max_orders must be >= 1';
  END IF;
  IF p_max_orders > 5000 THEN
    RAISE EXCEPTION 'expire_old_orders: p_max_orders exceeds maximum (5000)';
  END IF;

  cutoff := now() - (p_min_age_minutes * interval '1 minute');

  FOR o IN
    SELECT id, store_id, metadata
    FROM public.orders
    WHERE lower(trim(status)) = 'pending'
      AND created_at < cutoff
    ORDER BY created_at ASC
    LIMIT p_max_orders
    FOR UPDATE SKIP LOCKED
  LOOP
    reserved := coalesce((o.metadata ->> 'stock_reserved_at_create')::boolean, false);

    IF reserved THEN
      PERFORM public.restore_stock_for_order(o.id, o.store_id);
      restocked := restocked + 1;
    END IF;

    UPDATE public.orders AS ord
    SET
      status = 'cancelled',
      updated_at = now(),
      metadata = coalesce(ord.metadata, '{}'::jsonb)
        || jsonb_build_object(
          'cancelled_reason', 'expired_pending_timeout',
          'auto_expired_at', to_char(timezone('UTC', now()), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        )
    WHERE ord.id = o.id
      AND ord.store_id = o.store_id;

    processed := processed + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'processed', processed,
    'stock_restores', restocked,
    'cutoff_utc', to_char(timezone('UTC', cutoff), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'min_age_minutes', p_min_age_minutes,
    'batch_limit', p_max_orders
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.expire_old_orders(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_old_orders(integer, integer) TO service_role;

COMMENT ON FUNCTION public.expire_old_orders(integer, integer) IS
  'Cancela pedidos pending mais antigos que p_min_age_minutes; repõe estoque via restore_stock_for_order só com stock_reserved_at_create.';
