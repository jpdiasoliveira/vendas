import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { X } from "lucide-react";
import { ProductDetailView } from "@/react-app/components/storefront/catalog/ProductDetailView";
import type { Product } from "@/react-app/types";

type ProductDetailModalProps = {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddedToCart?: () => void;
};

export function ProductDetailModal({ product, isOpen, onClose, onAddedToCart }: ProductDetailModalProps) {
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

              <div className="overflow-y-auto scrollbar-slim">
                <div id="product-modal-title" className="sr-only">
                  {product.name}
                </div>
                <ProductDetailView
                  product={product}
                  onAddedToCart={onAddedToCart}
                  imageLayoutId={`product-image-${product.id}`}
                />
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </LayoutGroup>,
    document.body,
  );
}
