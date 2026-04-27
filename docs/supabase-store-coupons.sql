-- =============================================================================
-- Cupons de desconto por loja + colunas no pedido
-- =============================================================================
-- Execute no SQL Editor do Supabase.
-- Validação e valor do desconto são sempre recalculados no Worker (não confiar no front).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.store_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value numeric(14, 4) NOT NULL CHECK (discount_value > 0),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_store_coupons_store_code_lower
  ON public.store_coupons (store_id, (lower(code)));

CREATE INDEX IF NOT EXISTS idx_store_coupons_store_active ON public.store_coupons (store_id, active);

COMMENT ON TABLE public.store_coupons IS
  'Cupom por loja: percent (0–100) ou fixed (R$). Validade obrigatória; código case-insensitive na aplicação.';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS coupon_discount numeric(14, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.orders.coupon_code IS 'Código do cupom aplicado (normalizado em minúsculas no servidor).';
COMMENT ON COLUMN public.orders.coupon_discount IS 'Valor absoluto do desconto em R$ (calculado no servidor).';
