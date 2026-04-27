-- =============================================================================
-- RLS multi-tenant: produtos, categorias, pedidos e itens
-- =============================================================================
-- Objetivo: cada consulta (SELECT/INSERT/UPDATE/DELETE) com role **authenticated**
-- só enxerga dados das lojas em que o usuário está em `store_members`.
--
-- IMPORTANTE — Worker com Service Role:
-- O backend (`SUPABASE_SERVICE_ROLE_KEY`) **não passa por RLS**. As políticas abaixo
-- são a última linha de defesa para: client direto, Realtime, vazamentos de chave
-- anon, e evolução futura da arquitetura.
--
-- Pré-requisito: `public.store_members` (user_id → auth.users).
-- =============================================================================

-- ----- categories -----
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_member" ON public.categories;
CREATE POLICY "categories_select_member"
  ON public.categories FOR SELECT TO authenticated
  USING (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "categories_insert_member" ON public.categories;
CREATE POLICY "categories_insert_member"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "categories_update_member" ON public.categories;
CREATE POLICY "categories_update_member"
  ON public.categories FOR UPDATE TO authenticated
  USING (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "categories_delete_member" ON public.categories;
CREATE POLICY "categories_delete_member"
  ON public.categories FOR DELETE TO authenticated
  USING (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

-- ----- products -----
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_member" ON public.products;
CREATE POLICY "products_select_member"
  ON public.products FOR SELECT TO authenticated
  USING (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "products_insert_member" ON public.products;
CREATE POLICY "products_insert_member"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "products_update_member" ON public.products;
CREATE POLICY "products_update_member"
  ON public.products FOR UPDATE TO authenticated
  USING (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "products_delete_member" ON public.products;
CREATE POLICY "products_delete_member"
  ON public.products FOR DELETE TO authenticated
  USING (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

-- ----- orders -----
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own_as_buyer" ON public.orders;
CREATE POLICY "orders_select_own_as_buyer"
  ON public.orders FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "orders_select_member" ON public.orders;
CREATE POLICY "orders_select_member"
  ON public.orders FOR SELECT TO authenticated
  USING (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "orders_insert_member" ON public.orders;
CREATE POLICY "orders_insert_member"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "orders_update_member" ON public.orders;
CREATE POLICY "orders_update_member"
  ON public.orders FOR UPDATE TO authenticated
  USING (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "orders_delete_member" ON public.orders;
CREATE POLICY "orders_delete_member"
  ON public.orders FOR DELETE TO authenticated
  USING (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

-- ----- order_items -----
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_buyer" ON public.order_items;
CREATE POLICY "order_items_select_buyer"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_items_select_member" ON public.order_items;
CREATE POLICY "order_items_select_member"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_items_insert_member" ON public.order_items;
CREATE POLICY "order_items_insert_member"
  ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_items_update_member" ON public.order_items;
CREATE POLICY "order_items_update_member"
  ON public.order_items FOR UPDATE TO authenticated
  USING (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_items_delete_member" ON public.order_items;
CREATE POLICY "order_items_delete_member"
  ON public.order_items FOR DELETE TO authenticated
  USING (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );
