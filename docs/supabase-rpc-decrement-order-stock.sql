-- =============================================================================
-- RPC: baixa atômica de estoque por pedido (multi-tenant)
-- =============================================================================
-- Execute no SQL Editor do Supabase após o schema SaaS (products + order_items).
-- Garante: UPDATE ... SET stock = stock - qty WHERE stock >= qty; se alguma
-- linha não atualizar, aborta a transação inteira (nenhuma baixa parcial).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.decrement_stock_for_order(
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
      stock = p.stock - r.qty,
      updated_at = now()
    WHERE p.id = r.product_id
      AND p.store_id = p_store_id
      AND p.stock >= r.qty;

    GET DIAGNOSTICS n = ROW_COUNT;
    IF n = 0 THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', r.product_id::text
        USING ERRCODE = 'P0001';
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_stock_for_order(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_stock_for_order(uuid, uuid) TO service_role;

COMMENT ON FUNCTION public.decrement_stock_for_order(uuid, uuid) IS
  'Baixa estoque de todos os itens do pedido de forma atômica; P0001 INSUFFICIENT_STOCK se faltar.';
