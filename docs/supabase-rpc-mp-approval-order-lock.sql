-- =============================================================================
-- RPC: aprovação Mercado Pago com tranca na linha do pedido (anti-corrida)
-- =============================================================================
-- Execute no SQL Editor do Supabase após:
--   - docs/supabase-saas-multitenant-v1.sql
--   - docs/supabase-rpc-decrement-order-stock.sql
--
-- Não grava colunas removidas (ex.: payment_provider): idempotência via
-- payment_id + índice parcial (store_id, payment_id).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.apply_mp_approval_with_order_lock(
  p_order_id uuid,
  p_mp_payment_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  o public.orders%ROWTYPE;
  prev text;
  pin text;
BEGIN
  IF p_mp_payment_id IS NULL OR btrim(p_mp_payment_id) = '' THEN
    RETURN 'updated_non_paid';
  END IF;

  pin := btrim(p_mp_payment_id);

  SELECT * INTO o FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 'skipped_not_found';
  END IF;

  prev := lower(trim(o.status));

  IF prev IN ('cancelled', 'canceled') THEN
    RETURN 'updated_non_paid';
  END IF;

  IF prev IN ('paid', 'approved', 'shipped', 'delivered') THEN
    IF o.payment_id IS NOT NULL AND btrim(o.payment_id) <> '' THEN
      IF btrim(o.payment_id) = pin THEN
        RETURN 'idempotent_skip';
      ELSE
        RETURN 'payment_id_conflict';
      END IF;
    END IF;

    UPDATE public.orders
    SET
      payment_id = pin,
      updated_at = now()
    WHERE id = p_order_id;

    RETURN 'paid';
  END IF;

  IF prev <> 'pending' THEN
    RETURN 'updated_non_paid';
  END IF;

  BEGIN
    PERFORM public.decrement_stock_for_order(p_order_id, o.store_id);
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%INSUFFICIENT_STOCK%' THEN
        UPDATE public.orders
        SET
          status = 'cancelled',
          updated_at = now(),
          payment_id = pin,
          metadata = COALESCE(metadata, '{}'::jsonb)
            || jsonb_build_object('insufficient_stock_at_payment', true)
        WHERE id = p_order_id;
        RETURN 'stock_conflict_cancelled';
      END IF;
      RAISE;
  END;

  UPDATE public.orders
  SET
    status = 'approved',
    paid_at = COALESCE(paid_at, now()),
    payment_id = pin,
    updated_at = now()
  WHERE id = p_order_id;

  RETURN 'paid';
END;
$function$;

REVOKE ALL ON FUNCTION public.apply_mp_approval_with_order_lock(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_mp_approval_with_order_lock(uuid, text) TO service_role;

COMMENT ON FUNCTION public.apply_mp_approval_with_order_lock(uuid, text) IS
  'Transação única: FOR UPDATE no pedido, idempotência, baixa de estoque e marca approved; ou cancela se INSUFFICIENT_STOCK.';
