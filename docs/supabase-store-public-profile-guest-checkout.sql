-- Executar no SQL Editor do Supabase (uma vez por projeto).
-- 1) Metadados da loja (contato, textos legais, redes, checkout) em JSON.
-- 2) Pedidos sem login: user_id opcional + e-mail do visitante para validar pagamento/consulta.

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS public_profile jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN store_settings.public_profile IS
  'JSON: contactPhone, contactWhatsapp, contactEmail, instagramUrl, facebookUrl, businessHours, shippingInfo, deliveryPolicy, returnsPolicy, privacyPolicy, requireLoginToCheckout (bool, default true).';

-- Se falhar por FK com auth.users, no Supabase: verifique constraints em orders.user_id
-- (pode ser necessário alterar/remover a FK antes de permitir NULL).
ALTER TABLE orders
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS guest_checkout_email TEXT;

COMMENT ON COLUMN orders.guest_checkout_email IS
  'E-mail informado no checkout sem login; usado com GET /payment e POST /payment para o mesmo pedido.';

CREATE INDEX IF NOT EXISTS idx_orders_guest_email_store
  ON orders (store_id, guest_checkout_email)
  WHERE guest_checkout_email IS NOT NULL;
