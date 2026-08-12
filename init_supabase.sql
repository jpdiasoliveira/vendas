-- =============================================================================
-- INICIALIZAÇÃO DE BANCO DE DADOS SUPABASE (SaaS E-commerce Multi-loja)
-- =============================================================================
-- Este script foi consolidado para criar toda a estrutura do projeto Jornada-e 
-- Vendas. Ele inclui a criação de tabelas, relacionamentos (v1), Políticas 
-- de Segurança de Linha (RLS) para isolar lojas, e funções (RPCs) de baixa/reposição 
-- atômica de estoque.
--
-- COMO USAR:
-- 1. Abra seu projeto no Supabase (app.supabase.com)
-- 2. Vá no menu "SQL Editor" (ícone de terminal)
-- 3. Clique em "New Query" e cole todo este arquivo
-- 4. Clique em "Run"
-- =============================================================================

-- =============================================================================
-- 1. LIMPEZA TOTAL (ATENÇÃO: ISSO APAGA TODOS OS DADOS DA TABELA PUBLIC)
-- =============================================================================

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- =============================================================================
-- 2. SCHEMA BASE (Tabelas e Relacionamentos)
-- =============================================================================

-- Remover views se existirem
DROP VIEW IF EXISTS public.view_audit_report CASCADE;
DROP VIEW IF EXISTS public.view_top_sellers CASCADE;

-- Limpeza de tabelas na ordem correta
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.store_settings CASCADE;
DROP TABLE IF EXISTS public.store_members CASCADE;
DROP TABLE IF EXISTS public.delivery_addresses CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;

-- Tabela raiz das Lojas (Tenants)
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_stores_status ON public.stores (status);

-- Membros das Lojas (Donos, Admins e Equipe ligados ao auth.users)
CREATE TABLE public.store_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id)
);
CREATE INDEX idx_store_members_store_id ON public.store_members (store_id);
CREATE INDEX idx_store_members_user_id ON public.store_members (user_id);

-- Configurações da Loja
CREATE TABLE public.store_settings (
  store_id uuid PRIMARY KEY REFERENCES public.stores (id) ON DELETE CASCADE,
  logo_url text,
  primary_color text,
  minimum_order_value numeric(14, 2),
  public_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  business_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  operating_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Catálogo: Categorias
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);

-- Catálogo: Produtos
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories (id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  price numeric(14, 2) NOT NULL CHECK (price >= 0),
  price_wholesale numeric(14, 2),
  min_quantity_wholesale integer,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  image_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);
CREATE INDEX idx_products_store_id ON public.products (store_id);
CREATE INDEX idx_products_category_id ON public.products (category_id);

-- Pedidos (Orders)
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores (id) ON DELETE RESTRICT,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  guest_checkout_email text,
  customer_name text,
  customer_phone text,
  delivery_address text,
  shipping_city text,
  shipping_state text,
  total numeric(14, 2) NOT NULL CHECK (total >= 0),
  currency text NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'approved', 'shipped', 'delivered', 'cancelled')),
  payment_method text,
  payment_id text,
  tracking_code text,
  shipping_method text,
  paid_at timestamptz,
  delivered_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_store_created ON public.orders (store_id, created_at DESC);
CREATE INDEX idx_orders_user_store ON public.orders (user_id, store_id);

-- Itens do Pedido (Order Items)
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products (id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_image text,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(14, 4) NOT NULL CHECK (price >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order_store ON public.order_items (order_id, store_id);
CREATE INDEX idx_order_items_store_product ON public.order_items (store_id, product_id);

-- Trigger: Consistência do Store ID entre Pedido e Item
CREATE OR REPLACE FUNCTION public.enforce_order_items_same_store()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE sid uuid;
BEGIN
  SELECT o.store_id INTO sid FROM public.orders o WHERE o.id = NEW.order_id;
  IF sid IS NULL THEN RAISE EXCEPTION 'Pedido % não encontrado', NEW.order_id; END IF;
  IF NEW.store_id IS DISTINCT FROM sid THEN RAISE EXCEPTION 'order_items.store_id deve coincidir com orders.store_id'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_order_items_same_store
  BEFORE INSERT OR UPDATE OF store_id, order_id ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_items_same_store();

-- Logs de Auditoria
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  resource_label text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_store_created ON public.audit_logs (store_id, created_at DESC);

-- Views de Consulta Otimizada
CREATE OR REPLACE VIEW public.view_audit_report AS
SELECT
  a.id, a.store_id, a.user_id, a.action, a.action AS action_key, a.resource_type, a.resource_id,
  COALESCE(NULLIF(trim(a.resource_label), ''), (a.resource_type || ' #' || a.resource_id)) AS nome_recurso,
  a.details, a.created_at, u.email AS user_email
FROM public.audit_logs a LEFT JOIN auth.users u ON u.id = a.user_id;

CREATE OR REPLACE VIEW public.view_top_sellers AS
SELECT
  li.store_id, li.product_id, SUM(li.quantity)::bigint AS units_sold
FROM public.order_items li
INNER JOIN public.orders o ON o.id = li.order_id AND o.store_id = li.store_id
WHERE lower(COALESCE(o.status, '')) IN ('paid', 'approved', 'shipped', 'delivered')
  AND o.created_at >= (now() - interval '30 days')
GROUP BY li.store_id, li.product_id
ORDER BY units_sold DESC NULLS LAST;


-- =============================================================================
-- 2. POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)
-- =============================================================================

-- Habilitar RLS em todas as tabelas cruciais
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Categories RLS
CREATE POLICY "categories_select_member" ON public.categories FOR SELECT TO authenticated
  USING (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()));
CREATE POLICY "categories_insert_member" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()));
CREATE POLICY "categories_update_member" ON public.categories FOR UPDATE TO authenticated
  USING (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()));
CREATE POLICY "categories_delete_member" ON public.categories FOR DELETE TO authenticated
  USING (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()));

-- Products RLS
CREATE POLICY "products_select_member" ON public.products FOR SELECT TO authenticated
  USING (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()));
CREATE POLICY "products_insert_member" ON public.products FOR INSERT TO authenticated
  WITH CHECK (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()));
CREATE POLICY "products_update_member" ON public.products FOR UPDATE TO authenticated
  USING (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()));
CREATE POLICY "products_delete_member" ON public.products FOR DELETE TO authenticated
  USING (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()));

-- Orders RLS
CREATE POLICY "orders_select_own_as_buyer" ON public.orders FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "orders_select_member" ON public.orders FOR SELECT TO authenticated
  USING (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()));
CREATE POLICY "orders_insert_member" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()));
CREATE POLICY "orders_update_member" ON public.orders FOR UPDATE TO authenticated
  USING (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()));
CREATE POLICY "orders_delete_member" ON public.orders FOR DELETE TO authenticated
  USING (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()));

-- Order Items RLS
CREATE POLICY "order_items_select_buyer" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));
CREATE POLICY "order_items_select_member" ON public.order_items FOR SELECT TO authenticated
  USING (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()));
CREATE POLICY "order_items_insert_member" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()));
CREATE POLICY "order_items_update_member" ON public.order_items FOR UPDATE TO authenticated
  USING (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()));
CREATE POLICY "order_items_delete_member" ON public.order_items FOR DELETE TO authenticated
  USING (store_id IN (SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()));


-- =============================================================================
-- 3. FUNÇÕES DE BANCO DE DADOS E PROCEDURES (RPCs) - PREVENÇÃO DE CONCORRÊNCIA
-- =============================================================================

-- RPC: Baixa de estoque Atômica
CREATE OR REPLACE FUNCTION public.decrement_stock_for_order(p_order_id uuid, p_store_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  n int;
BEGIN
  FOR r IN SELECT product_id, quantity::int AS qty FROM public.order_items WHERE order_id = p_order_id AND store_id = p_store_id AND product_id IS NOT NULL LOOP
    UPDATE public.products p SET stock = p.stock - r.qty, updated_at = now() WHERE p.id = r.product_id AND p.store_id = p_store_id AND p.stock >= r.qty;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n = 0 THEN RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', r.product_id::text USING ERRCODE = 'P0001'; END IF;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.decrement_stock_for_order(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_stock_for_order(uuid, uuid) TO service_role;

-- RPC: Reposição de estoque Atômica
CREATE OR REPLACE FUNCTION public.restore_stock_for_order(p_order_id uuid, p_store_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  n int;
BEGIN
  FOR r IN SELECT product_id, quantity::int AS qty FROM public.order_items WHERE order_id = p_order_id AND store_id = p_store_id AND product_id IS NOT NULL LOOP
    UPDATE public.products p SET stock = p.stock + r.qty, updated_at = now() WHERE p.id = r.product_id AND p.store_id = p_store_id;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n = 0 THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND_ON_RESTORE:%', r.product_id::text USING ERRCODE = 'P0001'; END IF;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.restore_stock_for_order(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_stock_for_order(uuid, uuid) TO service_role;

-- RPC: Cron de Expiração de Pedidos (usado por Cloudflare Workers)
CREATE OR REPLACE FUNCTION public.expire_old_orders(p_min_age_minutes integer DEFAULT 60, p_max_orders integer DEFAULT 100)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  o record;
  reserved boolean;
  processed int := 0;
  restocked int := 0;
  cutoff timestamptz;
BEGIN
  IF p_min_age_minutes IS NULL OR p_min_age_minutes < 1 THEN RAISE EXCEPTION 'expire_old_orders: p_min_age_minutes must be >= 1'; END IF;
  IF p_max_orders IS NULL OR p_max_orders < 1 THEN RAISE EXCEPTION 'expire_old_orders: p_max_orders must be >= 1'; END IF;
  cutoff := now() - (p_min_age_minutes * interval '1 minute');
  FOR o IN SELECT id, store_id, metadata FROM public.orders WHERE lower(trim(status)) = 'pending' AND created_at < cutoff ORDER BY created_at ASC LIMIT p_max_orders FOR UPDATE SKIP LOCKED LOOP
    reserved := coalesce((o.metadata ->> 'stock_reserved_at_create')::boolean, false);
    IF reserved THEN
      PERFORM public.restore_stock_for_order(o.id, o.store_id);
      restocked := restocked + 1;
    END IF;
    UPDATE public.orders AS ord SET status = 'cancelled', updated_at = now(), metadata = coalesce(ord.metadata, '{}'::jsonb) || jsonb_build_object('cancelled_reason', 'expired_pending_timeout') WHERE ord.id = o.id AND ord.store_id = o.store_id;
    processed := processed + 1;
  END LOOP;
  RETURN jsonb_build_object('processed', processed, 'stock_restores', restocked, 'cutoff_utc', to_char(timezone('UTC', cutoff), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
END;
$function$;
REVOKE ALL ON FUNCTION public.expire_old_orders(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_old_orders(integer, integer) TO service_role;
