-- Reposição atómica de estoque por pedido (cancelamento MP/admin).
-- Depende de: order_items (order_id, store_id, product_id, quantity), products (id, store_id, stock).
-- Documentação: docs/supabase-rpc-restore-order-stock.sql (mesmo conteúdo).

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
