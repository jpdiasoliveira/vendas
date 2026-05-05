-- RLS: políticas explícitas "service only" (PostgREST anon/authenticated bloqueados).
-- service_role do Worker continua a ignorar RLS no Supabase.
-- Ver: Etapa 1 auditoria — platform_store_subscriptions, store_coupons, store_shipping_fare_bands tinham RLS sem políticas.

DROP POLICY IF EXISTS "platform_store_subscriptions_service_only" ON public.platform_store_subscriptions;
CREATE POLICY "platform_store_subscriptions_service_only"
  ON public.platform_store_subscriptions
  FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "store_coupons_service_only" ON public.store_coupons;
CREATE POLICY "store_coupons_service_only"
  ON public.store_coupons
  FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "store_shipping_fare_bands_service_only" ON public.store_shipping_fare_bands;
CREATE POLICY "store_shipping_fare_bands_service_only"
  ON public.store_shipping_fare_bands
  FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

COMMENT ON POLICY "platform_store_subscriptions_service_only" ON public.platform_store_subscriptions IS
  'Acesso direto PostgREST: negado. Worker usa service_role (bypass RLS).';

COMMENT ON POLICY "store_coupons_service_only" ON public.store_coupons IS
  'Acesso direto PostgREST: negado. Worker usa service_role (bypass RLS).';

COMMENT ON POLICY "store_shipping_fare_bands_service_only" ON public.store_shipping_fare_bands IS
  'Acesso direto PostgREST: negado. Worker usa service_role (bypass RLS).';
