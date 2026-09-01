# Fotos do catálogo demo

Coloque aqui as imagens dos sachês (PNG ou WebP) com estes nomes para referência manual no admin ou em SQL:

| Arquivo sugerido        | Produto                          |
|-------------------------|----------------------------------|
| `extra-picante.png`     | Banana Chips Extra Picante 300g  |
| `castanha-para.png`     | Castanha-do-Pará 300g            |
| `lime-cumin.png`        | Lime & Cumin 300g                |
| `acai-guarana.png`      | Açaí & Guaraná 300g              |
| `ervas-floresta.png`    | Ervas da Floresta 300g           |
| `defumado-jatoba.png`   | Defumado & Mel de Jatobá 300g    |

Depois do deploy, a URL pública será:

`https://<seu-dominio>/catalog/demo-store/<arquivo>`

Atualize `image_url` no Supabase (tabela `products`) ou pela tela de edição do admin.

O script `docs/seed-demo-catalog-and-history.sql` usa URLs temporárias (picsum) só para você testar fluxo; substitua pelas URLs reais quando as fotos estiverem hospedadas.
