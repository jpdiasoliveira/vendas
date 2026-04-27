-- =============================================================================
-- Supabase Storage — bucket `product-images` + políticas por loja
-- =============================================================================
-- 1) No Dashboard: Storage → Create bucket → id: product-images → Public bucket
--    (imagens de catálogo são URLs públicas na vitrine).
--
-- 2) Rode este script no SQL Editor (ajuste o nome do bucket se usar outro).
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Leitura pública (vitrine mostra fotos sem JWT)
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Upload: só pastas cujo primeiro segmento é um store_id onde o usuário é membro
DROP POLICY IF EXISTS "product_images_insert_member_store_folder" ON storage.objects;
CREATE POLICY "product_images_insert_member_store_folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] IN (
      SELECT sm.store_id::text
      FROM public.store_members sm
      WHERE sm.user_id = auth.uid()
    )
  );

-- Atualizar / apagar: mesmo critério de pasta
DROP POLICY IF EXISTS "product_images_update_member_store_folder" ON storage.objects;
CREATE POLICY "product_images_update_member_store_folder"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] IN (
      SELECT sm.store_id::text FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "product_images_delete_member_store_folder" ON storage.objects;
CREATE POLICY "product_images_delete_member_store_folder"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] IN (
      SELECT sm.store_id::text FROM public.store_members sm WHERE sm.user_id = auth.uid()
    )
  );
