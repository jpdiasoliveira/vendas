import { createPortal } from "react-dom";
import { X, ShoppingBag } from "lucide-react";
import type { Product } from "@/react-app/types";

type ProductDetailModalProps = {
  product: Product | null;
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: () => void;
};

const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

export const ProductDetailModal = ({
  product,
  imageUrl,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) => {
  if (!isOpen || !product) return null;

  const desc = product.description?.trim();
  const hasWholesale =
    product.priceWholesale != null &&
    product.priceWholesale > 0 &&
    product.minQuantityWholesale != null &&
    product.minQuantityWholesale > 0;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#1B4332]/50 backdrop-blur-md"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div
        className="scrollbar-slim relative z-[1] max-h-[90vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-white/50 bg-white/95 p-6 pr-5 shadow-2xl backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full text-[#6D4C41] transition-colors hover:bg-[#1B4332]/10 hover:text-[#1B4332]"
          aria-label="Fechar"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="relative mb-5 flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#FAF8F3] via-white to-[#FFD166]/10">
          <img
            src={imageUrl}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
        </div>

        <p className="mb-1 font-inter text-xs font-medium uppercase tracking-wide text-[#6D4C41]/80">
          {product.category?.trim() || "Produto"}
        </p>
        <h2
          id="product-detail-title"
          className="mb-3 font-playfair text-2xl font-bold text-[#1B4332] md:text-3xl"
        >
          {product.name}
        </h2>

        {desc ? (
          <p className="mb-6 font-inter text-base text-[#5a4035] leading-relaxed">{desc}</p>
        ) : (
          <p className="mb-6 font-inter text-base italic text-[#5a4035]">
            Descrição detalhada em breve. Em dúvida, fale com a loja pelo pedido ou redes sociais.
          </p>
        )}

        <div className="mb-4 rounded-2xl border border-[#1B4332]/10 bg-[#FAF8F3]/80 px-4 py-3 font-inter">
          <p className="text-sm text-[#6D4C41]">Preço</p>
          <p className="font-playfair text-3xl font-bold text-[#1B4332]">{formatBRL(product.price)}</p>
          {hasWholesale && (
            <p className="mt-2 border-t border-[#1B4332]/10 pt-2 text-sm text-[#6D4C41]">
              Atacado: {formatBRL(product.priceWholesale!)} a partir de{" "}
              <span className="font-semibold text-[#1B4332]">{product.minQuantityWholesale}</span> itens no mesmo
              pedido.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            onAddToCart();
            onClose();
          }}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] px-6 py-3.5 text-base font-inter font-medium text-white shadow-lg transition-all hover:shadow-[#1B4332]/30"
        >
          <ShoppingBag className="h-5 w-5" />
          Adicionar ao carrinho
        </button>
      </div>
    </div>,
    document.body
  );
};
