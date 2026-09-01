import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import CartModal from "@/react-app/components/storefront/cart/CartModal";
import GuestOrderLookupModal from "@/react-app/components/account/lookup/GuestOrderLookupModal";
import LoginModal from "@/react-app/components/LoginModal";
import { ProductDetailView } from "@/react-app/components/storefront/catalog/ProductDetailView";
import { StorefrontFooter } from "@/react-app/components/storefront/layout/StorefrontFooter";
import { StorefrontHeader } from "@/react-app/components/storefront/layout/StorefrontHeader";
import { StorefrontShell } from "@/react-app/components/storefront/layout/StorefrontShell";
import { Container } from "@/react-app/design-system/components/Container";
import { useProductBySlug } from "@/react-app/hooks/storefront/useProductBySlug";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { product, loading, error } = useProductBySlug(slug);
  const { settings } = useStoreSettings();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [guestOrderLookupOpen, setGuestOrderLookupOpen] = useState(false);

  const storeName = settings?.displayName?.trim() || "Loja";

  useEffect(() => {
    if (product?.name) {
      document.title = `${product.name} · ${storeName}`;
    }
  }, [product?.name, storeName]);

  return (
    <StorefrontShell>
      <StorefrontHeader
        onOpenCart={() => setIsCartOpen(true)}
        onOpenLogin={() => setShowLoginModal(true)}
        onOpenGuestOrderLookup={() => setGuestOrderLookupOpen(true)}
        scrollToProducts={() => void navigate("/#produtos")}
        scrollToTop={() => void navigate("/")}
      />

      <main className="relative py-10 sm:py-14">
        <Container>
          <Link
            to="/#produtos"
            className="mb-6 inline-flex items-center gap-2 font-body text-sm text-content-muted transition hover:text-content"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar ao catálogo
          </Link>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-brand-primary" aria-label="Carregando produto" />
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-3xl border border-brand-primary/10 bg-surface-elevated p-8 text-center">
              <p className="font-body text-content-muted">{error}</p>
              <Link
                to="/"
                className="mt-4 inline-flex rounded-full bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Ir para a vitrine
              </Link>
            </div>
          ) : null}

          {!loading && product ? (
            <article className="overflow-hidden rounded-3xl border border-brand-primary/10 bg-surface-elevated shadow-lg shadow-brand-primary/5">
              <ProductDetailView product={product} onAddedToCart={() => setIsCartOpen(true)} />
            </article>
          ) : null}
        </Container>
      </main>

      <StorefrontFooter onConsultOrder={() => setGuestOrderLookupOpen(true)} />

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <GuestOrderLookupModal
        isOpen={guestOrderLookupOpen}
        onClose={() => setGuestOrderLookupOpen(false)}
      />
    </StorefrontShell>
  );
}
