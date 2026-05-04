-- Inscrições na newsletter da vitrine (uma linha por par loja + e-mail).
-- Aplicar no Supabase (SQL Editor ou migração). O Worker usa service role (ignora RLS).

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_subscribers_email_len CHECK (char_length(email) >= 3 AND char_length(email) <= 320),
  CONSTRAINT newsletter_subscribers_store_email_unique UNIQUE (store_id, email)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_store_id ON newsletter_subscribers(store_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_store_created ON newsletter_subscribers(store_id, created_at DESC);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE newsletter_subscribers IS 'E-mails do formulário newsletter da vitrine; isolado por store_id.';
