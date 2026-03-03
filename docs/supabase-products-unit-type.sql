-- Adiciona coluna unit_type na tabela products (Un, Kg, Pacote, Fardo).
-- Executar no SQL Editor do Supabase se a coluna ainda não existir.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS unit_type TEXT;

COMMENT ON COLUMN products.unit_type IS 'Unidade de medida: Un, Kg, Pacote, Fardo';
