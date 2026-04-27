-- =============================================================================
-- Pedidos: provedor de pagamento + idempotência no banco (Mercado Pago)
-- =============================================================================
-- Execute no SQL Editor do Supabase (não destrutivo: ALTER + índice).
-- Pré-requisito: tabela public.orders (schema SaaS v1).
--
-- Objetivo:
-- - Colunas explícitas para gateway e preferência Checkout Pro.
-- - Índice único parcial: o mesmo (payment_provider, payment_id) não pode
--   aparecer em dois pedidos quando payment_id está preenchido — barreira
--   extra contra dupla liquidação / correlação errada no banco.
-- =============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_provider text NOT NULL DEFAULT 'mercadopago',
  ADD COLUMN IF NOT EXISTS payment_preference_id text;

COMMENT ON COLUMN public.orders.payment_provider IS
  'Gateway de cobrança (ex.: mercadopago). Usado em unicidade de payment_id.';
COMMENT ON COLUMN public.orders.payment_preference_id IS
  'ID da preferência Checkout Pro no Mercado Pago (correlação com retorno/checkout).';

-- Índice único parcial: ignora linhas sem payment_id (pedidos ainda não cobrados).
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_unique_provider_payment
  ON public.orders (payment_provider, payment_id)
  WHERE payment_id IS NOT NULL AND btrim(payment_id) <> '';
