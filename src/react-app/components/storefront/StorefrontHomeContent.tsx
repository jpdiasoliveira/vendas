import type { Product } from "@/react-app/types";
import { StorefrontHeader } from "@/react-app/components/storefront/layout/StorefrontHeader";
import { StorefrontFooter } from "@/react-app/components/storefront/layout/StorefrontFooter";
import { HeroSection } from "@/react-app/components/storefront/hero/HeroSection";
import { CatalogPreviewSection } from "@/react-app/components/storefront/sections/CatalogPreviewSection";
import { LifestyleSection } from "@/react-app/components/storefront/sections/LifestyleSection";
import { BenefitsSection } from "@/react-app/components/storefront/sections/BenefitsSection";
import { StorySection } from "@/react-app/components/storefront/sections/StorySection";
import { NewsletterSection } from "@/react-app/components/storefront/sections/NewsletterSection";

type StorefrontHomeContentProps = {
  products: Product[];
  loading: boolean;
  error: string | null;
  trendingProductIds: readonly string[];
  onOpenCart: () => void;
  onOpenLogin: () => void;
  onOpenGuestOrderLookup: () => void;
  scrollToProducts: () => void;
  scrollToTop: () => void;
  previewMode?: boolean;
};

import { HorizontalGallery } from "@/react-app/components/storefront/layout/HorizontalGallery";
import { StarfieldBackground } from "@/react-app/components/storefront/layout/StarfieldBackground";

/** Conteúdo compartilhado entre a Home live e a pré-visualização admin. */
export function StorefrontHomeContent({
  products,
  loading,
  error,
  trendingProductIds,
  onOpenCart,
  onOpenLogin,
  onOpenGuestOrderLookup,
  scrollToProducts,
  scrollToTop,
  previewMode = false,
}: StorefrontHomeContentProps) {
  return (
    <>
      <StarfieldBackground />
      <StorefrontHeader
        onOpenCart={onOpenCart}
        onOpenLogin={onOpenLogin}
        onOpenGuestOrderLookup={onOpenGuestOrderLookup}
        scrollToProducts={scrollToProducts}
        scrollToTop={scrollToTop}
        previewMode={previewMode}
      />
      <main>
        <HorizontalGallery previewMode={previewMode}>
          <div className="gallery-panel w-screen h-screen flex-shrink-0 flex items-center justify-center overflow-hidden">
            <HeroSection onShopClick={scrollToProducts} previewLayout={previewMode} />
          </div>
          <div className="gallery-panel w-screen h-screen flex-shrink-0 flex items-center justify-center overflow-hidden">
            <CatalogPreviewSection
              products={products}
              loading={loading}
              error={error}
              trendingProductIds={trendingProductIds}
              previewMode={previewMode}
              onOpenCart={onOpenCart}
            />
          </div>
          <div className="gallery-panel w-screen h-screen flex-shrink-0 flex items-center justify-center overflow-hidden">
            <StorySection />
          </div>
          <div className="gallery-panel w-screen h-screen flex-shrink-0 flex items-center justify-center overflow-hidden">
            <LifestyleSection />
          </div>
          <div className="gallery-panel w-screen h-screen flex-shrink-0 flex items-center justify-center overflow-hidden">
            <BenefitsSection />
          </div>
          <div className="gallery-panel w-screen h-screen flex-shrink-0 flex items-center justify-center overflow-hidden">
            <NewsletterSection />
          </div>
        </HorizontalGallery>
      </main>
      <StorefrontFooter onConsultOrder={onOpenGuestOrderLookup} previewMode={previewMode} />
    </>
  );
}
