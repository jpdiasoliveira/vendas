import CartModal from "@/react-app/components/storefront/cart/CartModal";
import GuestOrderLookupModal from "@/react-app/components/account/lookup/GuestOrderLookupModal";
import LoginModal from "@/react-app/components/LoginModal";
import { StorefrontShell } from "@/react-app/components/storefront/layout/StorefrontShell";
import { StorefrontHomeContent } from "@/react-app/components/storefront/StorefrontHomeContent";
import { useHomePage } from "@/react-app/hooks/storefront/useHomePage";

export default function HomePage() {
  const home = useHomePage();

  return (
    <StorefrontShell>
      <StorefrontHomeContent
        products={home.products}
        loading={home.loading}
        error={home.error}
        trendingProductIds={home.trendingProductIds}
        onOpenCart={() => home.setIsCartOpen(true)}
        onOpenLogin={() => home.setShowLoginModal(true)}
        onOpenGuestOrderLookup={() => home.setGuestOrderLookupOpen(true)}
        scrollToProducts={home.scrollToProducts}
        scrollToTop={home.scrollToTop}
      />

      <CartModal isOpen={home.isCartOpen} onClose={() => home.setIsCartOpen(false)} />
      <LoginModal isOpen={home.showLoginModal} onClose={() => home.setShowLoginModal(false)} />
      <GuestOrderLookupModal
        isOpen={home.guestOrderLookupOpen}
        onClose={() => home.setGuestOrderLookupOpen(false)}
      />
    </StorefrontShell>
  );
}
