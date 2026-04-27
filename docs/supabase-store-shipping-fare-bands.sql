-- =============================================================================
-- Frete por faixa de CEP (por loja) + colunas no pedido
-- =============================================================================
-- Execute no SQL Editor do Supabase (não destrutivo).
-- Depois insira faixas por store_id (ex.: SP capital, ou Brasil inteiro em demo).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.store_shipping_fare_bands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  cep_from integer NOT NULL CHECK (cep_from >= 0 AND cep_from <= 99999999),
  cep_to integer NOT NULL CHECK (cep_to >= 0 AND cep_to <= 99999999),
  amount_brl numeric(14, 2) NOT NULL CHECK (amount_brl >= 0),
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cep_from <= cep_to)
);

CREATE INDEX IF NOT EXISTS idx_shipping_bands_store ON public.store_shipping_fare_bands (store_id);
CREATE INDEX IF NOT EXISTS idx_shipping_bands_store_cep ON public.store_shipping_fare_bands (store_id, cep_from, cep_to);

COMMENT ON TABLE public.store_shipping_fare_bands IS
  'Faixas de CEP (somente dígitos, 8 posições) e valor de frete. O Worker calcula o frete sem confiar no navegador.';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_postal_code text,
  ADD COLUMN IF NOT EXISTS shipping_fee numeric(14, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.orders.shipping_postal_code IS 'CEP de entrega (apenas dígitos, 8 posições).';
COMMENT ON COLUMN public.orders.shipping_fee IS 'Valor do frete somado ao total do pedido (calculado no servidor).';

-- Exemplo (troque o UUID pelo store_id da sua loja):
-- INSERT INTO public.store_shipping_fare_bands (store_id, cep_from, cep_to, amount_brl, label)
-- VALUES ('00000000-0000-0000-0000-000000000000', 1000000, 99999999, 19.90, 'Brasil — demo');
