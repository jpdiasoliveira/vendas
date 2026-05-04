-- =============================================================================
-- RLS: newsletter_subscribers (multi-tenant por store_id)
-- =============================================================================
-- Espelho lógico de migrations/6.sql — aplicar no SQL Editor do Supabase ou
-- via Supabase CLI / migrações remotas na mesma ordem que migrations/5.sql.
--
-- Pré-requisitos: store_members; tabela newsletter_subscribers (migrations/5.sql).
-- =============================================================================

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_subscribers_select_member" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_subscribers_insert_member" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_subscribers_update_member" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_subscribers_delete_member" ON public.newsletter_subscribers;

CREATE POLICY "newsletter_subscribers_select_member"
  ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

CREATE POLICY "newsletter_subscribers_insert_member"
  ON public.newsletter_subscribers FOR INSERT TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

CREATE POLICY "newsletter_subscribers_update_member"
  ON public.newsletter_subscribers FOR UPDATE TO authenticated
  USING (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

CREATE POLICY "newsletter_subscribers_delete_member"
  ON public.newsletter_subscribers FOR DELETE TO authenticated
  USING (
    store_id IN (
      SELECT sm.store_id FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.newsletter_subscribers IS
'Inscrições newsletter por loja. RLS: membros authenticated da loja; inscrição pública via Worker (service role).';
