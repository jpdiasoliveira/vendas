-- Reverte apenas as políticas da migração 6 (mantém RLS da migração 5).
DROP POLICY IF EXISTS "newsletter_subscribers_select_member" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_subscribers_insert_member" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_subscribers_update_member" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_subscribers_delete_member" ON public.newsletter_subscribers;
