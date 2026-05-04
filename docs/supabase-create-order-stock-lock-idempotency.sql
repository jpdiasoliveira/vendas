-- =============================================================================
-- Pedidos: idempotency_key + RPC atômica (FOR UPDATE + reserva de estoque)
-- =============================================================================
-- Execute no SQL Editor do Supabase após o schema SaaS (orders, order_items,
-- products) e antes de confiar na criação concorrente segura.
--
-- Efeitos:
-- 1) Coluna orders.idempotency_key + índice único parcial (store_id, key).
-- 2) RPC create_order_with_stock_lock: tranca produtos em ordem, baixa estoque
--    (reserva na criação), insere pedido + itens; mesma chave → mesmo pedido.
-- 3) Atualiza apply_mp_approval_with_order_lock para NÃO baixar estoque de novo
--    quando metadata.stock_reserved_at_create = true.
-- 4) Reposição atómica em cancelamentos: aplicar também
--    docs/supabase-rpc-restore-order-stock.sql (RPC restore_stock_for_order).
-- =============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key text;

COMMENT ON COLUMN public.orders.idempotency_key IS
  'Chave enviada pelo cliente (ex.: Idempotency-Key) para evitar pedido duplicado em double-submit.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_store_idempotency_key
  ON public.orders (store_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND btrim(idempotency_key) <> '';

-- -----------------------------------------------------------------------------
-- RPC: criar pedido pending com reserva de estoque + idempotência
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order_with_stock_lock(
  p_store_id uuid,
  p_idempotency_key text,
  p_user_id uuid,
  p_total numeric,
  p_currency text,
  p_shipping_postal_code text,
  p_shipping_fee numeric,
  p_coupon_code text,
  p_coupon_discount numeric,
  p_guest_checkout_email text,
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address text,
  p_line_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  key text := nullif(btrim(p_idempotency_key), '');
  existing_id uuid;
  new_id uuid;
  r record;
  n int;
  stk int;
  meta jsonb := jsonb_build_object('stock_reserved_at_create', true);
BEGIN
  IF p_line_items IS NULL OR jsonb_typeof(p_line_items) <> 'array' OR jsonb_array_length(p_line_items) < 1 THEN
    RAISE EXCEPTION 'INVALID_LINE_ITEMS';
  END IF;

  IF key IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(key), hashtext(p_store_id::text));
    SELECT o.id INTO existing_id
    FROM public.orders o
    WHERE o.store_id = p_store_id AND o.idempotency_key = key
    LIMIT 1;
    IF existing_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'order_id', existing_id::text,
        'idempotent', true,
        'shipping_postal_code', p_shipping_postal_code
      );
    END IF;
  END IF;

  BEGIN
    FOR r IN
      SELECT *
      FROM (
        SELECT
          (e->>'product_id')::uuid AS product_id,
          coalesce(nullif(trim(e->>'product_name'), ''), 'Produto') AS product_name,
          nullif(trim(e->>'product_image'), '') AS product_image,
          (e->>'quantity')::int AS quantity,
          (e->>'price')::numeric AS price
        FROM jsonb_array_elements(p_line_items) AS e
      ) s
      ORDER BY product_id
    LOOP
      IF r.product_id IS NULL OR r.quantity IS NULL OR r.quantity < 1 THEN
        RAISE EXCEPTION 'INVALID_LINE';
      END IF;

      SELECT p.stock INTO stk
      FROM public.products p
      WHERE p.id = r.product_id AND p.store_id = p_store_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'PRODUCT_NOT_FOUND:%', r.product_id::text;
      END IF;

      IF stk < r.quantity THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', r.product_id::text USING ERRCODE = 'P0001';
      END IF;

      UPDATE public.products p
      SET
        stock = p.stock - r.quantity,
        updated_at = now()
      WHERE p.id = r.product_id
        AND p.store_id = p_store_id
        AND p.stock >= r.quantity;

      GET DIAGNOSTICS n = ROW_COUNT;
      IF n = 0 THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', r.product_id::text USING ERRCODE = 'P0001';
      END IF;
    END LOOP;

    INSERT INTO public.orders (
      store_id,
      user_id,
      guest_checkout_email,
      customer_name,
      customer_phone,
      delivery_address,
      total,
      currency,
      status,
      payment_method,
      shipping_postal_code,
      shipping_fee,
      coupon_code,
      coupon_discount,
      metadata,
      idempotency_key,
      updated_at
    )
    VALUES (
      p_store_id,
      p_user_id,
      CASE WHEN p_guest_checkout_email IS NULL OR btrim(p_guest_checkout_email) = '' THEN NULL
           ELSE lower(btrim(p_guest_checkout_email)) END,
      nullif(btrim(p_customer_name), ''),
      nullif(btrim(p_customer_phone), ''),
      nullif(btrim(p_delivery_address), ''),
      p_total,
      coalesce(nullif(btrim(p_currency), ''), 'BRL'),
      'pending',
      NULL,
      p_shipping_postal_code,
      p_shipping_fee,
      nullif(btrim(p_coupon_code), ''),
      coalesce(p_coupon_discount, 0),
      meta,
      key,
      now()
    )
    RETURNING id INTO new_id;

    INSERT INTO public.order_items (
      order_id,
      store_id,
      product_id,
      product_name,
      product_image,
      quantity,
      price
    )
    SELECT
      new_id,
      p_store_id,
      (e->>'product_id')::uuid,
      coalesce(nullif(trim(e->>'product_name'), ''), 'Produto'),
      nullif(trim(e->>'product_image'), ''),
      (e->>'quantity')::int,
      (e->>'price')::numeric
    FROM jsonb_array_elements(p_line_items) AS e;

    RETURN jsonb_build_object(
      'order_id', new_id::text,
      'idempotent', false,
      'shipping_postal_code', p_shipping_postal_code
    );

  EXCEPTION
    WHEN unique_violation THEN
      SELECT o.id INTO existing_id
      FROM public.orders o
      WHERE o.store_id = p_store_id AND o.idempotency_key = key
      LIMIT 1;
      IF existing_id IS NULL THEN
        RAISE;
      END IF;
      RETURN jsonb_build_object(
        'order_id', existing_id::text,
        'idempotent', true,
        'shipping_postal_code', p_shipping_postal_code
      );
  END;

END;
$function$;

REVOKE ALL ON FUNCTION public.create_order_with_stock_lock(
  uuid, text, uuid, numeric, text, text, numeric, text, numeric, text, text, text, text, jsonb
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_order_with_stock_lock(
  uuid, text, uuid, numeric, text, text, numeric, text, numeric, text, text, text, text, jsonb
) TO service_role;

COMMENT ON FUNCTION public.create_order_with_stock_lock IS
  'Cria pedido pending: tranca produtos (FOR UPDATE), reserva estoque, insere itens; idempotency_key deduplica.';

-- -----------------------------------------------------------------------------
-- RPC: aprovação MP — pular baixa se estoque já reservado na criação
-- -----------------------------------------------------------------------------
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
  reserved boolean;
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

  reserved := coalesce((o.metadata ->> 'stock_reserved_at_create')::boolean, false);

  IF NOT reserved THEN
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
  END IF;

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
