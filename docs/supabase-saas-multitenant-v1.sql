-- =============================================================================
-- SaaS E-commerce Multi-Loja — schema v1 (PostgreSQL / Supabase)
-- =============================================================================
-- ATENÇÃO: script DESTRUTIVO. Remove views e tabelas de negócio atuais e recria
-- o modelo genérico com isolamento por store_id (UUID).
-- Faça backup antes de rodar em produção. Execute no SQL Editor do Supabase.
-- =============================================================================

-- ----- 0) Remover views dependentes -----
DROP VIEW IF EXISTS public.view_audit_report CASCADE;
DROP VIEW IF EXISTS public.view_top_sellers CASCADE;

-- ----- 1) Remover tabelas (ordem: dependentes primeiro) -----
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.store_settings CASCADE;
DROP TABLE IF EXISTS public.store_members CASCADE;
DROP TABLE IF EXISTS public.delivery_addresses CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;

-- =============================================================================
-- 2) Lojas (tenant raiz)
-- =============================================================================
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stores_status ON public.stores (status);

COMMENT ON TABLE public.stores IS 'Tenant raiz: cada loja SaaS possui um UUID único (id).';

-- =============================================================================
-- 3) Membros por loja (Supabase Auth: auth.users)
-- =============================================================================
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

COMMENT ON TABLE public.store_members IS 'RBAC por loja: owner > admin > staff.';

-- =============================================================================
-- 4) Configurações avançadas da loja (aparência, regras, limites, horários)
-- =============================================================================
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

COMMENT ON COLUMN public.store_settings.theme IS 'Aparência extra (fontes, radius, modo escuro, etc.).';
COMMENT ON COLUMN public.store_settings.business_rules IS 'Regras (ex.: require_login_to_checkout, métodos de pagamento habilitados).';
COMMENT ON COLUMN public.store_settings.operating_hours IS 'Horários de funcionamento / SLA (estrutura livre em JSON).';
COMMENT ON COLUMN public.store_settings.order_limits IS 'Limites (ex.: max_orders_per_day, max_itens_por_pedido).';

-- =============================================================================
-- 5) Catálogo genérico
-- =============================================================================
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

-- =============================================================================
-- 6) Pedidos (cliente no próprio pedido — sem delivery_addresses)
-- =============================================================================
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
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'approved', 'shipped', 'delivered', 'cancelled')),
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

COMMENT ON COLUMN public.orders.delivery_address IS 'Endereço completo de entrega (texto único; SaaS genérico).';
COMMENT ON COLUMN public.orders.guest_checkout_email IS 'Quando user_id é null, usado para acesso ao pedido/pagamento.';

-- =============================================================================
-- 7) Itens do pedido (histórico imutável por linha; store_id redundante p/ RLS/queries)
-- =============================================================================
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

COMMENT ON TABLE public.order_items IS 'Line items: snapshot de nome/preço/imagem no momento da compra.';

-- Garantir consistência store_id entre pedido e item (trigger)
CREATE OR REPLACE FUNCTION public.enforce_order_items_same_store()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE sid uuid;
BEGIN
  SELECT o.store_id INTO sid FROM public.orders o WHERE o.id = NEW.order_id;
  IF sid IS NULL THEN
    RAISE EXCEPTION 'Pedido % não encontrado', NEW.order_id;
  END IF;
  IF NEW.store_id IS DISTINCT FROM sid THEN
    RAISE EXCEPTION 'order_items.store_id deve coincidir com orders.store_id';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_items_same_store
  BEFORE INSERT OR UPDATE OF store_id, order_id ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_items_same_store();

-- =============================================================================
-- 8) Auditoria de segurança
-- =============================================================================
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

-- =============================================================================
-- 9) Views de relatório
-- =============================================================================
CREATE OR REPLACE VIEW public.view_audit_report AS
SELECT
  a.id,
  a.store_id,
  a.user_id,
  a.action,
  a.action AS action_key,
  a.resource_type,
  a.resource_id,
  COALESCE(
    NULLIF(trim(a.resource_label), ''),
    (a.resource_type || ' #' || a.resource_id)
  ) AS nome_recurso,
  a.details,
  a.created_at,
  u.email AS user_email
FROM public.audit_logs a
LEFT JOIN auth.users u ON u.id = a.user_id;

CREATE OR REPLACE VIEW public.view_top_sellers AS
SELECT
  li.store_id,
  li.product_id,
  SUM(li.quantity)::bigint AS units_sold
FROM public.order_items li
INNER JOIN public.orders o ON o.id = li.order_id AND o.store_id = li.store_id
WHERE lower(COALESCE(o.status, '')) IN ('paid', 'approved', 'shipped', 'delivered')
  AND o.created_at >= (now() - interval '30 days')
GROUP BY li.store_id, li.product_id
ORDER BY units_sold DESC NULLS LAST;

-- =============================================================================
-- Fim do schema v1. Próximo passo: inserir loja + store_members (ver docs
-- supabase-setup-admin-natfoods.sql, atualizado para UUIDs).
-- =============================================================================
