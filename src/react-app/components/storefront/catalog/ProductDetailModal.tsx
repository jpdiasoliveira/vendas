import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { X } from "lucide-react";
import { AddToCartButton } from "@/react-app/components/storefront/catalog/AddToCartButton";
import { ImageReveal } from "@/react-app/components/storefront/media/ImageReveal";
import { ProductModalPricing } from "@/react-app/components/storefront/catalog/ProductModalPricing";
import { QuantityStepper } from "@/react-app/components/storefront/catalog/QuantityStepper";
import { useProductCartActions } from "@/react-app/hooks/storefront/useProductCartActions";
import { useToast } from "@/react-app/providers/ToastProvider";
import type { Product } from "@/react-app/types";

type ProductDetailModalProps = {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddedToCart?: () => void;
};

export function ProductDetailModal({ product, isOpen, onClose, onAddedToCart }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { addProductToCart } = useProductCartActions();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    setQuantity(1);
  }, [isOpen, product?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  const outOfStock = product?.stock != null && product.stock <= 0;

  const handleAdd = () => {
    if (!product) return;
    const success = addProductToCart(product, quantity);
    if (!success) {
      showToast({ type: "error", message: "Não foi possível adicionar — verifique o estoque disponível." });
      return;
    }
    onAddedToCart?.();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <LayoutGroup id="product-catalog">
      <AnimatePresence>
        {isOpen && product ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Fechar detalhes do produto"
            className="absolute inset-0 bg-surface/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            layout
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="relative z-10 flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-brand-primary/15 bg-surface-elevated shadow-2xl sm:max-h-[88dvh] sm:rounded-3xl"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 rounded-full border border-brand-primary/15 bg-surface/80 p-2 text-content-muted backdrop-blur-sm transition hover:text-content"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid overflow-y-auto scrollbar-slim md:grid-cols-2">
              <div className="relative aspect-square bg-surface-muted md:aspect-auto md:min-h-[22rem]">
                {product.imageUrl ? (
                  <motion.div layoutId={`product-image-${product.id}`} className="h-full w-full">
                    <ImageReveal src={product.imageUrl} alt={product.name} className="h-full w-full" />
                  </motion.div>
                ) : (
                  <div className="flex h-full min-h-[16rem] items-center justify-center font-body text-content-muted">
                    Sem imagem
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-5 p-6 md:p-8">
                {product.category ? (
                  <p className="font-body text-xs uppercase tracking-[0.2em] text-content-muted">{product.category}</p>
                ) : null}
                <h2 id="product-modal-title" className="font-display text-2xl font-bold text-content sm:text-3xl">
                  {product.name}
                </h2>
                {product.description ? (
                  <p className="font-body text-sm leading-relaxed text-content-muted">{product.description}</p>
                ) : null}

                <ProductModalPricing product={product} quantity={quantity} />

                <div className="mt-auto space-y-4 pt-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-body text-sm text-content-muted">Quantidade</span>
                    <QuantityStepper
                      value={quantity}
                      max={product.stock}
                      onChange={setQuantity}
                    />
                  </div>
                  <AddToCartButton onAdd={handleAdd} disabled={outOfStock} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        ) : null}
      </AnimatePresence>
    </LayoutGroup>,
    document.body,
  );
}
