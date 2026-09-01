-- =============================================================================
-- Seed: catálogo demo + pedidos de exemplo + auditoria (testes multi-tenant)
-- =============================================================================
-- Pré-requisitos:
--   1) Schema v1: docs/supabase-saas-multitenant-v1.sql
--   2) Loja + admin: docs/supabase-setup-admin-demo-store.sql (slug demo-store)
--
-- No bloco DO abaixo, defina:
--   v_admin_email  → mesmo e-mail de Authentication > Users (dono dos logs)
--
-- Imagens: por padrão URLs estáveis (picsum). Troque image_url depois pelas suas.
--
-- Idempotência: apaga pedidos demo (metadata.seed = 'demo_store_seed'); produtos
-- e categorias usam ON CONFLICT.
-- =============================================================================

DO $$
DECLARE
  -- OBRIGATÓRIO: mesmo e-mail de Authentication > Users (senão audit_logs e pedidos logados falham).
  -- Troque pela sua conta, ex.: 'admin@example.com'
  v_admin_email text := '';
  v_store_id uuid;
  v_user_id uuid;
  cat_linha_amazonia uuid := 'c0000001-0001-0001-0001-000000000001';
  cat_snacks uuid := 'c0000002-0001-0001-0001-000000000001';
  -- UUID = só hex 0-9a-f (não use prefixos como "p")
  p1 uuid := '00000001-0000-4000-8000-000000000101';
  p2 uuid := '00000001-0000-4000-8000-000000000102';
  p3 uuid := '00000001-0000-4000-8000-000000000103';
  p4 uuid := '00000001-0000-4000-8000-000000000104';
  p5 uuid := '00000001-0000-4000-8000-000000000105';
  p6 uuid := '00000001-0000-4000-8000-000000000106';
  o1 uuid;
  o2 uuid;
  o3 uuid;
  o4 uuid;
BEGIN
  IF trim(v_admin_email) = '' THEN
    RAISE EXCEPTION
      'Defina v_admin_email no DECLARE (aspas simples): ex. v_admin_email text := ''admin@example.com''; — deve existir em auth.users.';
  END IF;

  SELECT id INTO v_store_id FROM public.stores WHERE slug = 'demo-store' LIMIT 1;
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Loja slug demo-store não encontrada. Execute docs/supabase-setup-admin-demo-store.sql antes.';
  END IF;

  SELECT u.id INTO v_user_id FROM auth.users u WHERE lower(trim(u.email)) = lower(trim(v_admin_email)) LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum auth.users com e-mail "%".', v_admin_email;
  END IF;

  DELETE FROM public.orders
  WHERE store_id = v_store_id AND (metadata->>'seed') = 'demo_store_seed';

  INSERT INTO public.categories (id, store_id, name, slug, sort_order, created_at, updated_at)
  VALUES
    (cat_linha_amazonia, v_store_id, 'Linha Amazônia', 'linha-amazonia', 0, now(), now()),
    (cat_snacks, v_store_id, 'Snacks naturais', 'snacks-naturais', 1, now(), now())
  ON CONFLICT (store_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

  INSERT INTO public.products (
    id, store_id, category_id, name, slug, description, price, price_wholesale, min_quantity_wholesale,
    stock, status, image_url, metadata, created_at, updated_at
  ) VALUES
    (
      p1, v_store_id, cat_linha_amazonia,
      'Banana Chips Extra Picante — 300g',
      'demo-banana-extra-picante-300g',
      'Crocante e ardente, natural da Amazônia. Vegano, sem glúten e artesanal. Sabor intenso com pimenta — ¡muy caliente!',
      20.00, 16.00, 12,
      80, 'active',
      'https://picsum.photos/seed/demo-extra-picante/900/900',
      '{"peso_g":300,"marca":"Demo","selos":["vegano","sem_gluten","artesanal"]}'::jsonb,
      now(), now()
    ),
    (
      p2, v_store_id, cat_linha_amazonia,
      'Banana Chips Castanha-do-Pará — 300g',
      'demo-banana-castanha-para-300g',
      'Banana da Amazônia com notas de castanha-do-pará. Snack premium, vegano e sem glúten.',
      20.00, 16.50, 10,
      60, 'active',
      'https://picsum.photos/seed/demo-castanha/900/900',
      '{"peso_g":300,"marca":"Demo"}'::jsonb,
      now(), now()
    ),
    (
      p3, v_store_id, cat_linha_amazonia,
      'Banana Chips Lime & Cumin — 300g',
      'demo-banana-lime-cumin-300g',
      'Frescor cítrico do limão com cominho: leve, aromático e irresistível. Vegano, sem glúten, artesanal.',
      20.00, 16.00, 12,
      70, 'active',
      'https://picsum.photos/seed/demo-lime-cumin/900/900',
      '{"peso_g":300,"marca":"Demo"}'::jsonb,
      now(), now()
    ),
    (
      p4, v_store_id, cat_linha_amazonia,
      'Banana Chips Açaí & Guaraná — 300g',
      'demo-banana-acai-guarana-300g',
      'Fusão amazônica açaí + guaraná em chips crocantes. Energia e sabor regional, vegano e sem glúten.',
      20.00, 16.00, 12,
      55, 'active',
      'https://picsum.photos/seed/demo-acai-guarana/900/900',
      '{"peso_g":300,"marca":"Demo"}'::jsonb,
      now(), now()
    ),
    (
      p5, v_store_id, cat_linha_amazonia,
      'Banana Chips Ervas da Floresta — 300g',
      'demo-banana-ervas-floresta-300g',
      'Frescor e sabor da mata: blend de ervas da floresta. Artesanal, vegano e sem glúten.',
      20.00, 16.00, 12,
      65, 'active',
      'https://picsum.photos/seed/demo-ervas/900/900',
      '{"peso_g":300,"marca":"Demo"}'::jsonb,
      now(), now()
    ),
    (
      p6, v_store_id, cat_snacks,
      'Banana Chips Defumado & Mel de Jatobá — 300g',
      'demo-banana-defumado-mel-jatoba-300g',
      'Sabor de mata defumado com doçura do mel de jatobá. Edição especial Amazônia, artesanal.',
      22.90, 18.50, 8,
      40, 'active',
      'https://picsum.photos/seed/demo-defumado-jatoba/900/900',
      '{"peso_g":300,"marca":"Demo"}'::jsonb,
      now(), now()
    )
  ON CONFLICT (store_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    price_wholesale = EXCLUDED.price_wholesale,
    min_quantity_wholesale = EXCLUDED.min_quantity_wholesale,
    stock = EXCLUDED.stock,
    status = EXCLUDED.status,
    image_url = EXCLUDED.image_url,
    category_id = EXCLUDED.category_id,
    metadata = EXCLUDED.metadata,
    updated_at = now();

  o1 := gen_random_uuid();
  o2 := gen_random_uuid();
  o3 := gen_random_uuid();
  o4 := gen_random_uuid();

  INSERT INTO public.orders (
    id, store_id, user_id, guest_checkout_email, customer_name, customer_phone, delivery_address,
    total, currency, status, payment_method, payment_id, tracking_code, shipping_method,
    paid_at, delivered_at, metadata, created_at, updated_at
  ) VALUES
    (
      o1, v_store_id, v_user_id, NULL, 'Cliente Demo', '91999990001', 'Belém/PA — Retirada loja teste',
      60.00, 'BRL', 'delivered', 'pix', 'mp-demo-1001', 'BR123456789BR', 'Correios PAC',
      now() - interval '12 days', now() - interval '2 days',
      jsonb_build_object('seed', 'demo_store_seed', 'nota', 'Pedido entregue — histórico completo'),
      now() - interval '14 days', now() - interval '2 days'
    ),
    (
      o2, v_store_id, NULL, 'visitante.demo@example.com', 'Visitante Demo', '91988887777', 'Av. Nazaré, 1000 — Belém/PA',
      40.00, 'BRL', 'shipped', 'card', 'mp-demo-1002', 'BR998877665BR', 'Correios SEDEX',
      now() - interval '5 days', NULL,
      jsonb_build_object('seed', 'demo_store_seed'),
      now() - interval '6 days', now() - interval '1 day'
    ),
    (
      o3, v_store_id, v_user_id, NULL, 'Cliente Demo', '91999990001', 'Belém/PA — Bairro Umarizal',
      20.00, 'BRL', 'paid', 'pix', 'mp-demo-1003', NULL, NULL,
      now() - interval '1 day', NULL,
      jsonb_build_object('seed', 'demo_store_seed'),
      now() - interval '2 days', now() - interval '1 day'
    ),
    (
      o4, v_store_id, v_user_id, NULL, 'Cliente Demo', '91999990001', 'Belém/PA',
      20.00, 'BRL', 'pending', NULL, NULL, NULL, NULL,
      NULL, NULL,
      jsonb_build_object('seed', 'demo_store_seed', 'nota', 'Carrinho aguardando pagamento'),
      now() - interval '2 hours', now() - interval '2 hours'
    );

  INSERT INTO public.order_items (id, store_id, order_id, product_id, product_name, product_image, quantity, price, created_at)
  VALUES
    (gen_random_uuid(), v_store_id, o1, p1, 'Banana Chips Extra Picante — 300g', 'https://picsum.photos/seed/demo-extra-picante/200/200', 2, 20.0000, now() - interval '14 days'),
    (gen_random_uuid(), v_store_id, o1, p3, 'Banana Chips Lime & Cumin — 300g', 'https://picsum.photos/seed/demo-lime-cumin/200/200', 1, 20.0000, now() - interval '14 days'),
    (gen_random_uuid(), v_store_id, o2, p4, 'Banana Chips Açaí & Guaraná — 300g', 'https://picsum.photos/seed/demo-acai-guarana/200/200', 2, 20.0000, now() - interval '6 days'),
    (gen_random_uuid(), v_store_id, o3, p5, 'Banana Chips Ervas da Floresta — 300g', 'https://picsum.photos/seed/demo-ervas/200/200', 1, 20.0000, now() - interval '2 days'),
    (gen_random_uuid(), v_store_id, o4, p2, 'Banana Chips Castanha-do-Pará — 300g', 'https://picsum.photos/seed/demo-castanha/200/200', 1, 20.0000, now() - interval '2 hours');

  INSERT INTO public.audit_logs (store_id, user_id, action, resource_type, resource_id, resource_label, details, created_at)
  VALUES
    (v_store_id, v_user_id, 'CREATE_PRODUCT', 'product', p1::text, 'Produto #1', '{"origem":"seed_sql"}'::jsonb, now() - interval '20 days'),
    (v_store_id, v_user_id, 'UPDATE_PRODUCT', 'product', p3::text, 'Produto #3', '{"campo":"stock","para":70}'::jsonb, now() - interval '8 days'),
    (v_store_id, v_user_id, 'UPDATE_ORDER_STATUS', 'order', o1::text, 'Pedido', '{"status":"delivered"}'::jsonb, now() - interval '2 days');

  RAISE NOTICE 'Seed demo-store OK — store_id=%, produtos=6, pedidos demo=4, audit_logs=3', v_store_id;
END;
$$;

SELECT name, price, stock, status
FROM public.products
WHERE store_id = (SELECT id FROM public.stores WHERE slug = 'demo-store' LIMIT 1)
ORDER BY name;

SELECT status, total, created_at
FROM public.orders
WHERE store_id = (SELECT id FROM public.stores WHERE slug = 'demo-store' LIMIT 1)
  AND (metadata->>'seed') = 'demo_store_seed'
ORDER BY created_at;
