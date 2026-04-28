-- =============================================================================
-- Demo final — loja piloto, owner, catálogo premium, settings para apresentação
-- =============================================================================
-- Pré-requisitos: schema v1 (docs/supabase-saas-multitenant-v1.sql) + RPC estoque
-- se for usar pagamentos aprovados (docs/supabase-rpc-decrement-order-stock.sql).
--
-- OBRIGATÓRIO — edite SÓ a linha do INSERT abaixo (entre aspas simples), com o
-- mesmo e-mail de um utilizador já criado em: Authentication → Users.
-- Ex.: INSERT INTO _demo_seed_owner (email) VALUES ('joao@empresa.com');
--
-- Carro-chefe: image_url aponta para /demo/image_1.png (servido pela vitrine
-- Vite em dev). Garanta o ficheiro em public/demo/image_1.png no projeto.
-- =============================================================================

DROP TABLE IF EXISTS _demo_seed_owner;
CREATE TEMP TABLE _demo_seed_owner (email text NOT NULL);

INSERT INTO _demo_seed_owner (email) VALUES ('');

DO $$
DECLARE
  v_owner_email text;
  v_store_id uuid := 'a0000001-0001-0001-0001-000000000001';
  v_owner_id uuid;
  cat_selo uuid := 'd1000001-0001-4001-8001-000000000001';
  cat_mesa uuid := 'd1000002-0001-4001-8001-000000000002';
  cat_ritual uuid := 'd1000003-0001-4001-8001-000000000003';
  p_hero uuid := 'e2000001-0001-4001-8001-000000000001';
  p_a uuid := 'e2000002-0001-4001-8001-000000000002';
  p_b uuid := 'e2000003-0001-4001-8001-000000000003';
  p_c uuid := 'e2000004-0001-4001-8001-000000000004';
  p_d uuid := 'e2000005-0001-4001-8001-000000000005';
  p_e uuid := 'e2000006-0001-4001-8001-000000000006';
BEGIN
  SELECT trim(s.email) INTO v_owner_email FROM _demo_seed_owner s LIMIT 1;

  IF v_owner_email IS NULL OR v_owner_email = '' THEN
    RAISE EXCEPTION
      'Edite a linha ''INSERT INTO _demo_seed_owner (email) VALUES (''''...'''');'' no topo deste ficheiro: coloque o seu e-mail de Authentication → Users entre aspas simples (não deixe vazio).';
  END IF;

  SELECT u.id INTO v_owner_id
  FROM auth.users u
  WHERE lower(trim(u.email)) = lower(trim(v_owner_email))
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum auth.users com o e-mail "%".', v_owner_email;
  END IF;

  INSERT INTO public.stores (id, slug, display_name, status, created_at, updated_at)
  VALUES (
    v_store_id,
    'natfoods',
    'Amazônia Select — Mercado piloto',
    'active',
    'free',
    '{"demo":"platform_2026","tagline":"Da floresta para a sua mesa"}'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (slug) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    status = 'active',
    updated_at = now();

  INSERT INTO public.store_members (user_id, store_id, role, created_at, updated_at)
  VALUES (v_owner_id, v_store_id, 'owner', now(), now())
  ON CONFLICT (store_id, user_id) DO UPDATE SET
    role = 'owner',
    updated_at = now();

  INSERT INTO public.store_settings (
    store_id,
    logo_url,
    primary_color,
    minimum_order_value,
    public_profile,
    theme,
    business_rules,
    operating_hours,
    order_limits,
    created_at,
    updated_at
  )
  VALUES (
    v_store_id,
    null,
    '#1B4332',
    0,
    jsonb_build_object(
      'requireLoginToCheckout', false,
      'contactEmail', 'contato@demo-mercado.local',
      'contactWhatsapp', 'https://wa.me/5511999990000',
      'businessHours', 'Demo: atendimento simulado 24h. Produção segue calendário comercial.',
      'shippingInfo', 'Entregas em toda a região metropolitana (demo).',
      'deliveryPolicy', 'Pedidos demo: prazo combinado após confirmação de pagamento.'
    ),
    jsonb_build_object(
      'radiusPx', 16,
      'accent', '#FFD166',
      'fontHeading', 'Playfair Display',
      'fontBody', 'Inter'
    ),
    jsonb_build_object(
      'require_login_to_checkout', false,
      'paymentsEnabled', jsonb_build_array('pix', 'credit_card')
    ),
    jsonb_build_object(
      'demoAlwaysOpen', true,
      'weekdays', jsonb_build_array(
        jsonb_build_object('day', 'mon', 'open', '08:00', 'close', '22:00'),
        jsonb_build_object('day', 'tue', 'open', '08:00', 'close', '22:00'),
        jsonb_build_object('day', 'wed', 'open', '08:00', 'close', '22:00'),
        jsonb_build_object('day', 'thu', 'open', '08:00', 'close', '22:00'),
        jsonb_build_object('day', 'fri', 'open', '08:00', 'close', '22:00'),
        jsonb_build_object('day', 'sat', 'open', '09:00', 'close', '20:00'),
        jsonb_build_object('day', 'sun', 'open', '10:00', 'close', '18:00')
      )
    ),
    jsonb_build_object('max_items_per_order', 50),
    now(),
    now()
  )
  ON CONFLICT (store_id) DO UPDATE SET
    primary_color = EXCLUDED.primary_color,
    minimum_order_value = EXCLUDED.minimum_order_value,
    public_profile = EXCLUDED.public_profile,
    theme = EXCLUDED.theme,
    business_rules = EXCLUDED.business_rules,
    operating_hours = EXCLUDED.operating_hours,
    order_limits = EXCLUDED.order_limits,
    updated_at = now();

  INSERT INTO public.categories (id, store_id, name, slug, sort_order, created_at, updated_at)
  VALUES
    (cat_selo, v_store_id, 'Selo Amazônia', 'selo-amazonia', 0, now(), now()),
    (cat_mesa, v_store_id, 'Mesa assinatura', 'mesa-assinatura', 1, now(), now()),
    (cat_ritual, v_store_id, 'Ritual & bem-estar', 'ritual-bem-estar', 2, now(), now())
  ON CONFLICT (store_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

  INSERT INTO public.products (
    id, store_id, category_id, name, slug, description, price, price_wholesale, min_quantity_wholesale,
    stock, status, image_url, metadata, created_at, updated_at
  ) VALUES
    (
      p_hero, v_store_id, cat_selo,
      'Carro-chefe — Mix Selo Amazônia Noite (280g)',
      'carro-chefe-mix-selo-amazonia-noite-280g',
      'Blend premium: banana da terra crocante, castanha-do-pará tostada e cacau 70%. Pouch hermético, baixo sal, zero corantes. O carro-chefe da demo.',
      42.90, 36.90, 8,
      120, 'active',
      '/demo/image_1.png',
      '{"seed":"platform_demo_2026","hero":true,"notas":"Cacau + castanha + banana"}'::jsonb,
      now(), now()
    ),
    (
      p_a, v_store_id, cat_selo,
      'Chips de mandioca defumada — 220g',
      'chips-mandioca-defumada-220g',
      'Lâminas finas, defumação suave em cumaru, crocância persistente. Acompanha drinks e tábuas.',
      28.50, 24.00, 10,
      95, 'active',
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=900&q=80',
      '{"seed":"platform_demo_2026"}'::jsonb,
      now(), now()
    ),
    (
      p_b, v_store_id, cat_mesa,
      'Kit degustação 4 sabores — edição demo',
      'kit-degustacao-4-sabores-demo',
      'Quatro porções individuais (45g cada): clássico, lemon-pepper, fumaça leve e doce de cupuaçu.',
      56.00, 48.00, 6,
      60, 'active',
      'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=900&q=80',
      '{"seed":"platform_demo_2026"}'::jsonb,
      now(), now()
    ),
    (
      p_c, v_store_id, cat_mesa,
      'Azeite de pequi — garrafa 250ml',
      'azeite-de-pequi-250ml',
      'Notas frutadas e amanteigadas. Finalização para saladas, peixes e risotos da linha assinatura.',
      64.00, null, null,
      40, 'active',
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=900&q=80',
      '{"seed":"platform_demo_2026"}'::jsonb,
      now(), now()
    ),
    (
      p_d, v_store_id, cat_ritual,
      'Infusão amazônica — jarra 12 sachês',
      'infusao-amazonica-12-saches',
      'Blend de hibisco, camu-camu e capim-limão. Sem conservantes; embalagem compostável.',
      39.00, 33.00, 8,
      75, 'active',
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=900&q=80',
      '{"seed":"platform_demo_2026"}'::jsonb,
      now(), now()
    ),
    (
      p_e, v_store_id, cat_ritual,
      'Barra energética cupuaçu + macadâmia — caixa 6un',
      'barra-energetica-cupuacu-macadamia-6un',
      'Textura macia, baixo índice glicêmico, 12g de proteína vegetal. Para treinos e longas reuniões.',
      47.50, 40.00, 5,
      110, 'active',
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=900&q=80',
      '{"seed":"platform_demo_2026"}'::jsonb,
      now(), now()
    )
  ON CONFLICT (store_id, slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    price_wholesale = EXCLUDED.price_wholesale,
    min_quantity_wholesale = EXCLUDED.min_quantity_wholesale,
    stock = EXCLUDED.stock,
    status = EXCLUDED.status,
    image_url = EXCLUDED.image_url,
    metadata = EXCLUDED.metadata,
    updated_at = now();

  -- Frete demo (CEP 8 dígitos; faixa única) e cupom de teste (requer docs SQL de frete/cupom aplicados)
  DELETE FROM public.store_shipping_fare_bands WHERE store_id = v_store_id;
  INSERT INTO public.store_shipping_fare_bands (store_id, cep_from, cep_to, amount_brl, label, created_at, updated_at)
  VALUES (v_store_id, 1000000, 99999999, 12.90, 'Demo — faixa nacional', now(), now());

  DELETE FROM public.store_coupons WHERE store_id = v_store_id;
  INSERT INTO public.store_coupons (
    store_id, code, discount_type, discount_value, valid_from, valid_until, active, created_at, updated_at
  ) VALUES (
    v_store_id,
    'bemvindo10',
    'percent',
    10,
    now() - interval '1 day',
    now() + interval '365 days',
    true,
    now(),
    now()
  );
END;
$$;

-- Conferência rápida
SELECT id, slug, display_name, status FROM public.stores WHERE slug = 'natfoods';
SELECT sm.role, u.email FROM public.store_members sm JOIN auth.users u ON u.id = sm.user_id
WHERE sm.store_id = 'a0000001-0001-0001-0001-000000000001';
SELECT minimum_order_value, primary_color, public_profile->>'requireLoginToCheckout' AS guest_checkout
FROM public.store_settings WHERE store_id = 'a0000001-0001-0001-0001-000000000001';
SELECT name, slug, stock, image_url, metadata->>'hero' AS hero FROM public.products
WHERE store_id = 'a0000001-0001-0001-0001-000000000001'
ORDER BY CASE WHEN metadata->>'hero' = 'true' THEN 0 ELSE 1 END, name;
