-- =============================================================================
-- Pedidos: limpeza de legado (payment_provider / payment_preference_id)
-- =============================================================================
-- Execute no SQL Editor do Supabase se ainda existirem objetos da migração antiga.
--
-- O schema atual usa:
-- - payment_id + índice parcial idx_orders_store_payment_id (store_id, payment_id)
-- - metadata JSONB (ex.: mp_checkout_preference_id, flags operacionais)
-- - audit_logs para eventos de pagamento (sem segredos em massa no pedido)
-- =============================================================================

DROP INDEX IF EXISTS public.idx_orders_unique_provider_payment;

ALTER TABLE public.orders
  DROP COLUMN IF EXISTS payment_preference_id,
  DROP COLUMN IF EXISTS payment_provider;
