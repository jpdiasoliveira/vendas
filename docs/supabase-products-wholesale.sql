-- Opcional: adicione estas colunas na tabela products do Supabase
-- para ativar preços por atacado (multi-tier pricing).
--
-- Executar no SQL Editor do Supabase se a tabela products ainda não tiver os campos.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS price_wholesale REAL,
  ADD COLUMN IF NOT EXISTS min_quantity_wholesale INTEGER;

COMMENT ON COLUMN products.price_wholesale IS 'Preço unitário quando quantidade >= min_quantity_wholesale';
COMMENT ON COLUMN products.min_quantity_wholesale IS 'Quantidade mínima para aplicar price_wholesale';
