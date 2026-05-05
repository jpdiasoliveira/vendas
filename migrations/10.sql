-- Credenciais Mercado Pago por loja (cifradas pelo Worker com MP_STORE_CREDENTIALS_SECRET).
-- Nunca expor estes campos em GET /api/store/settings (vitrine).

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS mp_access_token_ciphertext text,
  ADD COLUMN IF NOT EXISTS mp_public_key_ciphertext text;

COMMENT ON COLUMN public.store_settings.mp_access_token_ciphertext IS
  'Access Token MP da loja (AES-GCM, base64). Descriptografar só no Worker com MP_STORE_CREDENTIALS_SECRET.';

COMMENT ON COLUMN public.store_settings.mp_public_key_ciphertext IS
  'Public Key MP (opcional, AES-GCM). Usada sobretudo para integrações front; mesmo segredo de cifra.';
