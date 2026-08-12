import { useState } from "react";
import { Link } from "react-router";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Container } from "@/react-app/design-system/components/Container";
import { useCart } from "@/react-app/contexts/CartContext";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { adminStorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";
import { cn } from "@/react-app/design-system/cn";

type StorefrontHeaderProps = {
  onOpenCart: () => void;
  onOpenLogin: () => void;
  onOpenGuestOrderLookup: () => void;
  scrollToProducts: () => void;
  scrollToTop: () => void;
  previewMode?: boolean;
};

export function StorefrontHeader({
  onOpenCart,
  onOpenLogin,
  onOpenGuestOrderLookup,
  scrollToProducts,
  scrollToTop,
  previewMode = false,
}: StorefrontHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useCart();
  const { settings } = useStoreSettings();
  const { user } = useAuth();
  const displayName = settings?.displayName?.trim() || "Loja";

  const navItems = [
    { label: "Produtos", action: scrollToProducts },
    { label: "Pedidos", action: onOpenGuestOrderLookup },
  ];

  return (
    <header
      id={adminStorefrontPreviewSectionId("navbar")}
      className="sticky top-0 z-50 border-b border-brand-primary/10 bg-surface/80 backdrop-blur-xl"
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <button
          type="button"
          onClick={scrollToTop}
          className="font-display text-lg font-bold text-content transition hover:text-brand-primary"
        >
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt={displayName} className="h-9 w-auto object-contain" />
          ) : (
            displayName
          )}
        </button>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className="font-body text-sm text-content-muted transition hover:text-content"
            >
              {item.label}
            </button>
          ))}
          {!previewMode && user ? (
            <Link to="/pedidos" className="font-body text-sm text-content-muted transition hover:text-content">
              Minha conta
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenLogin}
            className="hidden rounded-full p-2 text-content-muted transition hover:bg-surface-muted hover:text-content sm:inline-flex"
            aria-label={user ? "Conta" : "Entrar"}
          >
            <User className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onOpenCart}
            className="relative rounded-full p-2 text-content-muted transition hover:bg-surface-muted hover:text-content"
            aria-label="Abrir carrinho"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 ? (
              <motion.span
                layout
                className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-primary px-1 font-body text-[10px] font-bold text-white"
              >
                {itemCount}
              </motion.span>
            ) : null}
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-content-muted transition hover:bg-surface-muted md:hidden"
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-brand-primary/10 md:hidden"
          >
            <Container className="flex flex-col gap-2 py-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    item.action();
                    setMobileOpen(false);
                  }}
                  className={cn(
                    "rounded-xl px-3 py-2 text-left font-body text-sm text-content-muted transition hover:bg-surface-muted hover:text-content",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
