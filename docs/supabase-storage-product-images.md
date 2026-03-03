# Bucket Supabase Storage: product-images

A rota **POST /api/admin/upload** envia imagens para o bucket **product-images** no Supabase Storage.

## Criar o bucket no Supabase

1. No [Dashboard do Supabase](https://supabase.com/dashboard), abra o projeto.
2. Vá em **Storage** no menu lateral.
3. Clique em **New bucket**.
4. Nome: **product-images**.
5. Marque **Public bucket** para que as URLs retornadas por `getPublicUrl()` funcionem sem autenticação (leitura pública para exibir fotos dos produtos).
6. (Opcional) Defina políticas RLS se quiser restringir quem pode fazer upload; o Worker usa a Service Role Key, então o upload é autorizado pelo backend.

## Estrutura dos arquivos

Os arquivos são salvos com o path: `{store_id}/{timestamp}-{nome-sanitizado}.{ext}`.

Exemplo: `a1b2c3d4-.../1730123456789-foto-produto.jpg`

## Segurança

- Apenas administradores logados (rota protegida por `verifyAuth`) podem chamar POST /api/admin/upload.
- Tipos permitidos: image/jpeg, image/png, image/webp, image/gif.
