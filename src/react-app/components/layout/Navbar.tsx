import { useState, useEffect } from "react";
import { Leaf, User, Package, LogOut, ShoppingCart, Menu, X, LayoutDashboard, Loader2, Search } from "lucide-react";
import { useCart } from "@/react-app/contexts/CartContext";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useAdminStoreRole } from "@/react-app/hooks/useAdminStoreRole";
import { useNavigate } from "react-router";
import LogoutConfirmModal from "@/react-app/components/LogoutConfirmModal";
import { storefrontShellClass } from "@/react-app/utils/storefrontLayout";

interface NavbarProps {
  onOpenCart: () => void;
  onOpenLogin: () => void;
  onOpenGuestOrderLookup?: () => void;
  scrollToProducts: () => void;
  scrollToTop: () => void;
}

const touchBtn = "min-h-[44px] min-w-[44px] inline-flex items-center justify-center";

export const Navbar = ({
  onOpenCart,
  onOpenLogin,
  onOpenGuestOrderLookup,
  scrollToProducts,
  scrollToTop,
}: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { itemCount } = useCart();
  const { settings } = useStoreSettings();
  const { user, signOut } = useAuth();
  const { ready: adminRoleReady, isStaff } = useAdminStoreRole();
  const navigate = useNavigate();
  const displayName = settings?.displayName?.trim() || "Sua Loja";
  const tagline = settings?.publicProfile?.tagline?.trim();
  const logoUrl = settings?.logoUrl?.trim();
  const primaryColor = settings?.primaryColor || "#1B4332";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  const navItems = ["Início", "Produtos", "Nossa História", "Contato"] as const;
  const navIds = ["#", "#produtos", "#historia", "#contato"] as const;

  const closeMobileNav = () => setMobileNavOpen(false);

  const handleNavClick = (index: number, e: React.MouseEvent) => {
    if (index === 0) {
      e.preventDefault();
      scrollToTop();
    }
    if (index === 1) {
      e.preventDefault();
      scrollToProducts();
    }
    closeMobileNav();
  };

  return (
    <nav
      className={`fixed top-0 z-40 w-full transition-all duration-500 ${
        scrolled ? "bg-white/70 backdrop-blur-xl shadow-lg shadow-[#1B4332]/5" : "bg-white/40 backdrop-blur-md"
      }`}
    >
      <div className={storefrontShellClass}>
        <div className="flex h-20 min-h-[5rem] w-full min-w-0 items-center gap-2">
          <div className="flex min-w-0 flex-1 basis-0 items-center gap-2 group">
            <div className="relative flex-shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-9 w-9 sm:h-10 sm:w-10 object-contain group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <>
                  <Leaf
                    className="h-9 w-9 sm:h-10 sm:w-10 text-[#1B4332] group-hover:rotate-12 transition-transform duration-300"
                    style={{ color: primaryColor }}
                  />
                  <div className="absolute inset-0 bg-[#FFD166]/20 blur-xl rounded-full group-hover:bg-[#FFD166]/30 transition-all" />
                </>
              )}
            </div>
            <div className="cursor-pointer min-w-0" onClick={scrollToTop}>
              <h1
                className="text-lg sm:text-2xl font-bold font-playfair truncate"
                style={{ color: primaryColor }}
              >
                {displayName}
              </h1>
              {tagline ? (
                <p className="text-xs text-[#6D4C41]/80 truncate">{tagline}</p>
              ) : null}
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-5 md:flex lg:gap-7">
            {navItems.map((item, index) => (
              <a
                key={item}
                href={navIds[index]}
                onClick={(e) => handleNavClick(index, e)}
                className="min-h-[44px] inline-flex items-center whitespace-nowrap px-0.5 font-inter text-[#6D4C41] transition-all duration-300 hover:text-[#1B4332] relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-[#1B4332] to-[#FFD166] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 basis-0 items-center justify-end gap-1 sm:gap-2">
            <button
              type="button"
              className={`${touchBtn} shrink-0 rounded-xl border border-[color:var(--brand-primary)]/15 bg-white/80 text-[var(--brand-primary)] md:hidden`}
              onClick={() => setMobileNavOpen((o) => !o)}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav-menu"
              aria-label={mobileNavOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            {user ? (
              <>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex min-h-[44px] items-center gap-2 rounded-full border border-[color:var(--brand-primary)]/10 bg-white/60 px-3 text-[var(--brand-primary)] backdrop-blur-sm transition-all duration-300 hover:shadow-lg sm:px-4"
                  >
                    <User className="h-5 w-5 shrink-0" />
                    <span className="hidden max-w-[10rem] truncate lg:inline">
                      {user.email?.split("@")[0]?.trim() || "Minha conta"}
                    </span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 py-2 z-50">
                      {!adminRoleReady ? (
                        <div className="flex min-h-[44px] items-center gap-2 px-4 text-xs text-[#6D4C41]/70">
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                          <span>Verificando permissões…</span>
                        </div>
                      ) : isStaff ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate("/admin/pedidos");
                          }}
                          className="flex min-h-[44px] w-full items-center gap-2 px-4 text-left font-inter text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary-soft)]"
                        >
                          <LayoutDashboard className="h-4 w-4 shrink-0" />
                          <span>Painel da loja</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate("/pedidos");
                          }}
                          className="flex min-h-[44px] w-full items-center gap-2 px-4 text-left font-inter text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary-soft)]"
                        >
                          <Package className="h-4 w-4 shrink-0" />
                          <span>Meus Pedidos</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-4 min-h-[44px] text-red-600 hover:bg-red-50 transition-colors font-inter text-left"
                      >
                        <LogOut className="h-4 w-4 shrink-0" />
                        <span>Sair</span>
                      </button>
                    </div>
                  )}
                </div>
                <LogoutConfirmModal
                  isOpen={showLogoutModal}
                  onClose={() => setShowLogoutModal(false)}
                  onConfirm={async () => {
                    await signOut();
                    setShowLogoutModal(false);
                  }}
                />
              </>
            ) : (
              <>
                {onOpenGuestOrderLookup ? (
                  <button
                    type="button"
                    onClick={onOpenGuestOrderLookup}
                    className={`hidden sm:inline-flex ${touchBtn} items-center gap-1.5 rounded-full border border-[#1B4332]/15 bg-white/50 px-3 text-sm font-medium text-[#1B4332] backdrop-blur-sm transition-all hover:bg-white/80`}
                  >
                    <Search className="h-4 w-4 shrink-0" />
                    <span className="max-w-[9rem] truncate lg:max-w-none">Consultar pedido</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onOpenLogin}
                    className="flex min-h-[44px] items-center gap-2 rounded-full border border-[color:var(--brand-primary)]/10 bg-white/60 px-3 font-inter font-medium text-[var(--brand-primary)] backdrop-blur-sm transition-all duration-300 hover:shadow-lg sm:px-4"
                >
                  <User className="h-5 w-5 shrink-0" />
                  <span className="hidden sm:inline">Entrar</span>
                </button>
              </>
            )}
            {!(adminRoleReady && isStaff) ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="group relative flex min-h-[44px] items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#FFD166] to-[#FFE084] px-4 font-inter font-medium text-[var(--brand-primary)] transition-all duration-300 hover:shadow-xl hover:shadow-[#FFD166]/50 sm:px-6"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FFE084] to-[#FFD166] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <ShoppingCart className="h-5 w-5 relative z-10 shrink-0" />
                  <span className="relative z-10 hidden sm:inline">Carrinho</span>
                </button>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] text-white text-xs font-bold rounded-full min-h-[22px] min-w-[22px] px-1 flex items-center justify-center shadow-lg z-10">
                    {itemCount}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {mobileNavOpen && (
        <>
          <div
            className="fixed inset-x-0 top-20 bottom-0 z-[35] bg-black/40 md:hidden"
            aria-hidden
            onClick={closeMobileNav}
          />
          <div
            id="mobile-nav-menu"
            className="fixed left-0 right-0 top-20 z-[36] md:hidden border-b border-[#1B4332]/10 bg-white/98 backdrop-blur-xl shadow-xl max-h-[min(70vh,calc(100dvh-5rem))] overflow-y-auto overscroll-contain"
            role="navigation"
            aria-label="Menu principal"
          >
            <ul className={`${storefrontShellClass} py-2 font-inter`}>
              {navItems.map((item, index) => (
                <li key={item}>
                  <a
                    href={navIds[index]}
                    onClick={(e) => handleNavClick(index, e)}
                    className="flex items-center min-h-[48px] px-3 text-base font-medium text-[#1B4332] hover:bg-[#FAF8F3] active:bg-[#1B4332]/5 rounded-xl"
                  >
                    {item}
                  </a>
                </li>
              ))}
              {onOpenGuestOrderLookup ? (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenGuestOrderLookup();
                      closeMobileNav();
                    }}
                    className="flex w-full min-h-[48px] items-center gap-2 px-3 text-left text-base font-medium text-[#1B4332] hover:bg-[#FAF8F3] active:bg-[#1B4332]/5 rounded-xl"
                  >
                    <Search className="h-5 w-5 shrink-0 opacity-80" />
                    Consultar pedido
                  </button>
                </li>
              ) : null}
            </ul>
          </div>
        </>
      )}
    </nav>
  );
};
