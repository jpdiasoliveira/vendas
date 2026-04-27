-- =============================================================================
-- store_settings: banner da vitrine (hero)
-- =============================================================================
-- Execute no SQL Editor do Supabase (idempotente).
-- O Worker e o admin já leem/gravam camelCase; coluna no banco: banner_url.

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS banner_url text;

COMMENT ON COLUMN public.store_settings.banner_url IS
  'URL pública da imagem de fundo do hero (vitrine). Opcional; se null, o front usa imagem padrão.';
