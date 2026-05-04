-- =============================================================================
-- Migração 6 — RLS em newsletter_subscribers (multi-tenant)
-- =============================================================================
-- Depende de: migrations/5.sql (tabela newsletter_subscribers + RLS ON).
-- Depende de: public.store_members (ver docs/supabase-store-members.sql).
--
-- O Worker usa SUPABASE_SERVICE_ROLE_KEY e ignora RLS. Estas políticas
-- restringem acesso direto com JWT authenticated aos tenants do utilizador.
-- Inscrição pública na vitrine permanece via POST /api/store/newsletter/subscribe.
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
