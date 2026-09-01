import { useState } from "react";
import { motion } from "motion/react";
import { AddToCartButton } from "@/react-app/components/storefront/catalog/AddToCartButton";
import { ImageReveal } from "@/react-app/components/storefront/media/ImageReveal";
import { ProductModalPricing } from "@/react-app/components/storefront/catalog/ProductModalPricing";
import { QuantityStepper } from "@/react-app/components/storefront/catalog/QuantityStepper";
import { useProductCartActions } from "@/react-app/hooks/storefront/useProductCartActions";
import { useToast } from "@/react-app/providers/ToastProvider";
import type { Product } from "@/react-app/types";

type ProductDetailViewProps = {
  product: Product;
  onAddedToCart?: () => void;
  /** Quando definido, anima transição com o card do catálogo (modal). */
  imageLayoutId?: string;
};

export function ProductDetailView({ product, onAddedToCart, imageLayoutId }: ProductDetailViewProps) {
  const [quantity, setQuantity] = useState(1);
  const { addProductToCart } = useProductCartActions();
  const { showToast } = useToast();

  const outOfStock = product.stock != null && product.stock <= 0;

  const handleAdd = () => {
    const success = addProductToCart(product, quantity);
    if (!success) {
      showToast({ type: "error", message: "Não foi possível adicionar — verifique o estoque disponível." });
      return;
    }
    onAddedToCart?.();
  };

  const imageBlock = product.imageUrl ? (
    imageLayoutId ? (
      <motion.div layoutId={imageLayoutId} className="h-full w-full">
        <ImageReveal src={product.imageUrl} alt={product.name} className="h-full w-full" />
      </motion.div>
    ) : (
      <ImageReveal src={product.imageUrl} alt={product.name} className="h-full w-full" />
    )
  ) : (
    <div className="flex h-full min-h-[16rem] items-center justify-center font-body text-content-muted">
      Sem imagem
    </div>
  );

  return (
    <div className="grid md:grid-cols-2">
      <div className="relative aspect-square bg-surface-muted md:aspect-auto md:min-h-[22rem]">
        {imageLayoutId ? (
          imageBlock
        ) : (
          <div className="h-full w-full">{imageBlock}</div>
        )}
      </div>

      <div className="flex flex-col gap-5 p-6 md:p-8">
        {product.category ? (
          <p className="font-body text-xs uppercase tracking-[0.2em] text-content-muted">{product.category}</p>
        ) : null}
        <h1 className="font-display text-2xl font-bold text-content sm:text-3xl">{product.name}</h1>
        {product.description ? (
          <p className="font-body text-sm leading-relaxed text-content-muted">{product.description}</p>
        ) : null}

        <ProductModalPricing product={product} quantity={quantity} />

        <div className="mt-auto space-y-4 pt-2">
          <div className="flex items-center justify-between gap-4">
            <span className="font-body text-sm text-content-muted">Quantidade</span>
            <QuantityStepper value={quantity} max={product.stock} onChange={setQuantity} />
          </div>
          <AddToCartButton onAdd={handleAdd} disabled={outOfStock} />
        </div>
      </div>
    </div>
  );
}
