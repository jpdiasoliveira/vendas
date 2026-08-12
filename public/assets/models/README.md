# Modelos 3D da vitrine (Hero)

Coloque aqui o arquivo GLB/GLTF do produto em destaque.

## Arquivo esperado

- **Nome padrão:** `product-featured.glb`
- **URL pública:** `/assets/models/product-featured.glb`

## Override por ambiente

Defina no `.env.local`:

```env
VITE_HERO_PRODUCT_MODEL_URL=/assets/models/product-featured.glb
```

Ou aponte para outro caminho/CDN da loja.

## Formato recomendado

- GLB otimizado (< 5 MB)
- Escala realista; o componente `HeroFeaturedProduct` centraliza e ajusta via `Bounds` do Drei.
