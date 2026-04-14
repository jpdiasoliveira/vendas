import { useState } from "react";
import { useCart } from "@/react-app/contexts/CartContext";
import type { Product } from "@/react-app/types";
import { ProductDetailModal } from "@/react-app/components/home/ProductDetailModal";

type ProductCardProps = {
  product: Product;
  isFeatured?: boolean;
};

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/300";

const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

export const ProductCard = ({ product, isFeatured = false }: ProductCardProps) => {
  const { addItem } = useCart();
  const [detailOpen, setDetailOpen] = useState(false);
  const imageUrl = product.imageUrl ?? (product as { image_url?: string }).image_url ?? PLACEHOLDER_IMAGE;
  const description = product.description?.trim();

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: imageUrl,
      priceWholesale: product.priceWholesale ?? undefined,
      minQuantityWholesale: product.minQuantityWholesale ?? undefined,
      stock: product.stock ?? undefined,
    });
  };

  return (
    <div className={`group relative ${isFeatured ? "md:-mt-4" : ""}`}>
      <div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500 ${
          isFeatured
            ? "from-[#FFD166]/30 to-[#1B4332]/30 opacity-100 blur-2xl group-hover:blur-3xl"
            : "from-[#FFD166]/20 to-[#1B4332]/20 opacity-0 blur-xl group-hover:opacity-100 group-hover:blur-2xl"
        }`}
      />
      <div
        className={`relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-500 hover:shadow-2xl ${
          isFeatured
            ? "border-[#FFD166]/30 bg-white/90 shadow-2xl hover:-translate-y-3 hover:border-[#FFD166]/50"
            : "border-white/50 bg-white/80 shadow-xl hover:-translate-y-2 hover:border-[#FFD166]/30"
        }`}
      >
        {isFeatured && (
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
          <div
            className={`relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#FAF8F3] via-white to-[#FFD166]/${isFeatured ? "10" : "5"} px-6 pt-10 pb-4 sm:px-8`}
          >
            <div
              className={`absolute right-0 top-0 rounded-full ${
                isFeatured ? "h-40 w-40 bg-[#FFD166]/20 blur-3xl" : "h-32 w-32 bg-[#FFD166]/10 blur-2xl"
              }`}
            />
            <img
              src={imageUrl}
              alt=""
              className="relative z-10 max-h-full max-w-full object-contain transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="bg-gradient-to-b from-white/60 to-white/80 px-6 pb-2 pt-2 backdrop-blur-sm">
            <h4 className="mb-2 font-playfair text-2xl font-bold text-[#1B4332]">{product.name}</h4>
            {description ? (
              <p className="mb-2 line-clamp-2 font-inter text-sm text-[#6D4C41]">{description}</p>
            ) : null}
            <span className="inline-block font-inter text-sm font-semibold text-[#1B4332] underline decoration-[#1B4332]/30 underline-offset-4 transition-colors group-hover:decoration-[#1B4332]">
              Ver detalhes
            </span>
          </div>
        </button>

        <div className="flex items-center justify-between bg-gradient-to-b from-white/50 to-white/90 px-6 pb-6 pt-2 backdrop-blur-sm">
          <span className="bg-gradient-to-r from-[#1B4332] to-[#6D4C41] bg-clip-text font-playfair text-3xl font-bold text-transparent">
            {formatBRL(product.price)}
          </span>
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-full bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] px-6 py-2.5 font-inter font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#1B4332]/30"
          >
            Adicionar
          </button>
        </div>
      </div>

      <ProductDetailModal
        product={product}
        imageUrl={imageUrl}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onAddToCart={handleAdd}
      />
    </div>
  );
};
