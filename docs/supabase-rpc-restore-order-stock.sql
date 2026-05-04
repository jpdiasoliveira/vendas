-- =============================================================================
-- RPC: repor estoque de forma atómica por pedido (multi-tenant)
-- =============================================================================
-- Par simétrico de `decrement_stock_for_order` / reserva em
-- `create_order_with_stock_lock`. Usado em cancelamentos (MP, admin) para
-- evitar repõe parcial em falha a meio do loop no Worker.
--
-- Efeito: em uma transação PL/pgSQL, para cada order_item com product_id,
-- UPDATE products SET stock = stock + qty WHERE id AND store_id.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.restore_stock_for_order(
  p_order_id uuid,
  p_store_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  n int;
BEGIN
  FOR r IN
    SELECT product_id, quantity::int AS qty
    FROM public.order_items
    WHERE order_id = p_order_id
      AND store_id = p_store_id
      AND product_id IS NOT NULL
  LOOP
    UPDATE public.products p
    SET
      stock = p.stock + r.qty,
      updated_at = now()
    WHERE p.id = r.product_id
      AND p.store_id = p_store_id;

    GET DIAGNOSTICS n = ROW_COUNT;
    IF n = 0 THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND_ON_RESTORE:%', r.product_id::text
        USING ERRCODE = 'P0001';
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.restore_stock_for_order(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_stock_for_order(uuid, uuid) TO service_role;

COMMENT ON FUNCTION public.restore_stock_for_order(uuid, uuid) IS
  'Repor estoque de todos os itens do pedido na mesma transação; P0001 se produto sumiu.';
