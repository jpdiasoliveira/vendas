import { motion } from "motion/react";
import { Link } from "react-router";
import { Package, TrendingUp } from "lucide-react";
import { ImageReveal } from "@/react-app/components/storefront/media/ImageReveal";
import { formatCurrency } from "@/react-app/utils/format";
import { getProductPublicPath, productHasPublicPath } from "@/react-app/utils/productPublicPath";
import { cn } from "@/react-app/design-system/cn";
import type { Product } from "@/react-app/types";

type ProductCardProps = {
  product: Product;
  isTrending: boolean;
  onSelect: (product: Product) => void;
  interactive?: boolean;
};

export function ProductCard({ product, isTrending, onSelect, interactive = true }: ProductCardProps) {
  const Wrapper = interactive ? "button" : "article";

  return (
    <Wrapper
      type={interactive ? "button" : undefined}
      data-catalog-card
      onClick={interactive ? () => onSelect(product) : undefined}
      className={cn(
        "group relative w-full overflow-hidden rounded-3xl border border-brand-primary/10 bg-surface-elevated/80 text-left shadow-lg shadow-brand-primary/5 backdrop-blur-sm transition hover:border-brand-primary/25",
        interactive && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
        {product.imageUrl ? (
          <motion.div layoutId={`product-image-${product.id}`} className="h-full w-full">
            <ImageReveal
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full"
              imgClassName="transition duration-500 group-hover:scale-105"
            />
          </motion.div>
        ) : (
          <div className="flex h-full items-center justify-center text-content-muted">
            <Package className="h-10 w-10 opacity-40" aria-hidden />
          </div>
        )}
        {isTrending ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-primary px-2.5 py-1 font-body text-[10px] font-semibold uppercase tracking-wide text-white">
            <TrendingUp className="h-3 w-3" aria-hidden />
            Trending
          </span>
        ) : null}
      </div>
      <div className="p-4">
        {product.category ? (
          <p className="mb-1 font-body text-[10px] uppercase tracking-[0.18em] text-content-muted">
            {product.category}
          </p>
        ) : null}
        <h3 className="font-body text-sm font-semibold text-content line-clamp-2">{product.name}</h3>
        <p className="mt-2 font-display text-lg font-bold text-brand-primary">{formatCurrency(product.price)}</p>
        {productHasPublicPath(product) ? (
          <Link
            to={getProductPublicPath(product.slug)}
            onClick={(e) => e.stopPropagation()}
            className="mt-2 inline-block font-body text-xs font-medium text-brand-primary underline-offset-2 hover:underline"
          >
            Ver página do produto
          </Link>
        ) : null}
      </div>
    </Wrapper>
  );
}
