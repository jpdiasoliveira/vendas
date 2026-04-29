import { useState } from "react";
import { useCart } from "@/react-app/contexts/CartContext";
import type { Product } from "@/react-app/types";
import { ProductDetailModal } from "@/react-app/components/home/ProductDetailModal";
import {
  catalogCardImageFrameClass,
  catalogCardImageGlowClass,
  catalogCardImageInnerClass,
  catalogCardImageImgClass,
} from "@/react-app/utils/productCatalogImageLayout";
import {
  CATALOG_PRODUCT_IMAGE_SIZES,
  getCatalogProductImageSrc,
  getCatalogProductImageSrcSet,
} from "@/react-app/utils/catalogProductImageUrl";

type ProductCardProps = {
  product: Product;
  /** Badge e estilo “MAIS VENDIDO” (dados de vendas). */
  isTrending?: boolean;
  /** Destaque escolhido no admin (metadata). */
  isHomeFeatured?: boolean;
};

/** SVG data-URL: sem pedido HTTP externo (via.placeholder.com pode falhar ou bloquear). */
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect fill="#e2e8f0" width="800" height="1000"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#1B4332" font-family="system-ui,sans-serif" font-size="28">Produto</text></svg>`
  );

const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

export const ProductCard = ({ product, isTrending = false, isHomeFeatured = false }: ProductCardProps) => {
  const { addItem } = useCart();
  const [detailOpen, setDetailOpen] = useState(false);
  const isSpotlight = isTrending || isHomeFeatured;
  const rawImageUrl =
    (product.imageUrl ?? (product as { image_url?: string }).image_url ?? "").trim() || PLACEHOLDER_IMAGE;
  const imageSrc = getCatalogProductImageSrc(rawImageUrl);
  const imageSrcSet = getCatalogProductImageSrcSet(rawImageUrl);
  const description = product.description?.trim();

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: imageSrc,
      priceWholesale: product.priceWholesale ?? undefined,
      minQuantityWholesale: product.minQuantityWholesale ?? undefined,
      stock: product.stock ?? undefined,
    });
  };

  return (
    <div className="group relative">
      <div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500 ${
          isSpotlight
            ? "from-[#FFD166]/30 to-[#1B4332]/30 opacity-100 blur-2xl group-hover:blur-3xl"
            : "from-[#FFD166]/20 to-[#1B4332]/20 opacity-0 blur-xl group-hover:opacity-100 group-hover:blur-2xl"
        }`}
      />
      <div
        className={`relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-500 hover:shadow-2xl ${
          isSpotlight
            ? "border-[#FFD166]/30 bg-white/90 shadow-2xl hover:-translate-y-3 hover:border-[#FFD166]/50"
            : "border-white/50 bg-white/80 shadow-xl hover:-translate-y-2 hover:border-[#FFD166]/30"
        }`}
      >
        {isTrending && (
          <div className="pointer-events-none absolute right-4 top-4 z-20">
            <div className="rounded-full bg-gradient-to-r from-[#FFD166] to-[#FFE084] px-4 py-1.5 text-xs font-bold text-[#1B4332] shadow-lg backdrop-blur-sm">
              MAIS VENDIDO
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332]/40 focus-visible:ring-offset-2"
          aria-label={`Ver detalhes de ${product.name}`}
        >
          <div className={catalogCardImageFrameClass(isSpotlight)}>
            <div className={catalogCardImageGlowClass(isSpotlight)} aria-hidden />
            <div className={catalogCardImageInnerClass}>
              <img
                src={imageSrc}
                srcSet={imageSrcSet}
                sizes={imageSrcSet ? CATALOG_PRODUCT_IMAGE_SIZES : undefined}
                alt=""
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className={catalogCardImageImgClass}
              />
            </div>
          </div>
          <div className="bg-gradient-to-b from-white/60 to-white/80 px-6 pb-2 pt-2 backdrop-blur-sm">
            <h4 className="mb-2 font-playfair text-xl font-bold text-[#1B4332] sm:text-2xl break-words">{product.name}</h4>
            {description ? (
              <p className="mb-2 line-clamp-3 font-inter text-base text-[#5a4035] leading-snug">{description}</p>
            ) : null}
            <span className="inline-block font-inter text-sm font-semibold text-[#1B4332] underline decoration-[#1B4332]/30 underline-offset-4 transition-colors group-hover:decoration-[#1B4332]">
              Ver detalhes
            </span>
          </div>
        </button>

        <div className="flex items-center justify-between bg-gradient-to-b from-white/50 to-white/90 px-6 pb-6 pt-2 backdrop-blur-sm">
          <span className="min-h-[44px] bg-gradient-to-r from-[#1B4332] to-[#6D4C41] bg-clip-text font-playfair text-2xl font-bold text-transparent sm:text-3xl">
            {formatBRL(product.price)}
          </span>
          <button
            type="button"
            onClick={handleAdd}
            className="min-h-[44px] min-w-[44px] shrink-0 rounded-full bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] px-5 py-3 font-inter text-base font-medium text-white transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-lg hover:shadow-[#1B4332]/30"
          >
            Adicionar
          </button>
        </div>
      </div>

      <ProductDetailModal
        product={product}
        imageUrl={imageSrc}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onAddToCart={handleAdd}
      />
    </div>
  );
};
