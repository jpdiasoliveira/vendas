import { useMemo, useRef } from "react";
import { LayoutGroup } from "motion/react";
import { Container } from "@/react-app/design-system/components/Container";
import { ProductCard } from "@/react-app/components/storefront/catalog/ProductCard";
import { ProductDetailModal } from "@/react-app/components/storefront/catalog/ProductDetailModal";
import { useScrollReveal } from "@/react-app/hooks/storefront/useScrollReveal";
import { useCatalogSection } from "@/react-app/hooks/storefront/useCatalogSection";
import { useCatalogGridStagger } from "@/react-app/hooks/storefront/useCatalogGridStagger";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { resolveStorefrontHome } from "@/react-app/utils/resolvedStorefrontHome";
import { adminStorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";
import type { Product } from "@/react-app/types";

type CatalogPreviewSectionProps = {
  products: Product[];
  loading: boolean;
  error: string | null;
  trendingProductIds: readonly string[];
  previewMode?: boolean;
  onOpenCart?: () => void;
};

export function CatalogPreviewSection({
  products,
  loading,
  error,
  trendingProductIds,
  previewMode = false,
  onOpenCart,
}: CatalogPreviewSectionProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { settings } = useStoreSettings();
  const displayName = settings?.displayName?.trim() || "Sua loja";
  const copy = resolveStorefrontHome(displayName, settings?.publicProfile);

  const { visibleProducts, selectedProduct, isModalOpen, openProduct, closeProduct } =
    useCatalogSection(products);

  const productIdsKey = useMemo(
    () => visibleProducts.map((product) => product.id).join("|"),
    [visibleProducts],
  );

  useScrollReveal(headerRef, { y: 28, duration: 0.65 });
  useCatalogGridStagger(gridRef, {
    enabled: !loading && !previewMode && visibleProducts.length > 0,
    productIds: productIdsKey,
  });

  return (
    <section id="produtos" data-preview-section="productsHead" className="relative py-20 sm:py-24">
      <Container>
        <div
          ref={headerRef}
          id={adminStorefrontPreviewSectionId("products")}
          className="mb-10 text-center"
        >
          <span className="mb-3 inline-block font-body text-xs font-medium uppercase tracking-[0.2em] text-brand-primary">
            {copy.productsGridEyebrow}
          </span>
          <h2 className="font-display text-3xl font-bold text-content sm:text-4xl">{copy.productsGridTitle}</h2>
          <p className="mx-auto mt-3 max-w-2xl font-body text-content-muted">{copy.productsGridSubtitle}</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-3xl bg-surface-muted" aria-hidden />
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <p
            role="alert"
            className="rounded-2xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-center font-body text-sm text-red-200"
          >
            {error}
          </p>
        ) : null}

        {!loading && !error && visibleProducts.length === 0 ? (
          <p className="text-center font-body text-content-muted">Nenhum produto disponível no momento.</p>
        ) : null}

        {!loading && visibleProducts.length > 0 ? (
          <LayoutGroup id="product-catalog">
            <div ref={gridRef} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isTrending={trendingProductIds.includes(product.id)}
                  onSelect={openProduct}
                  interactive={!previewMode}
                />
              ))}
            </div>
          </LayoutGroup>
        ) : null}
      </Container>

      {!previewMode ? (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={closeProduct}
          onAddedToCart={onOpenCart}
        />
      ) : null}
    </section>
  );
}
