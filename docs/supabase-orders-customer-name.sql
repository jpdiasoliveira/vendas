-- Opcional: adicione a coluna customer_name na tabela orders do Supabase
-- para exibir o nome do cliente no painel admin.
-- Executar no SQL Editor do Supabase se a coluna ainda não existir.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT;

COMMENT ON COLUMN orders.customer_name IS 'Nome do cliente (ex.: do perfil OAuth ou preenchido no checkout)';

-- Exemplo de atualização manual para teste (substitua o id pelo do seu pedido):
-- UPDATE orders SET customer_name = 'João do Teste' WHERE id = 1;
