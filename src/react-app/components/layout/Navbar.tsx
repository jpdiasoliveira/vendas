import { useState, useEffect } from "react";
import { Leaf, User, Package, LogOut, ShoppingCart } from "lucide-react";
import { useCart } from "@/react-app/contexts/CartContext";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router";
import LogoutConfirmModal from "@/react-app/components/LogoutConfirmModal";

interface NavbarProps {
  onOpenCart: () => void;
  onOpenLogin: () => void;
  scrollToProducts: () => void;
  scrollToTop: () => void;
}

export function Navbar({ onOpenCart, onOpenLogin, scrollToProducts, scrollToTop }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { itemCount } = useCart();
  const { settings } = useStoreSettings();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = settings?.displayName?.trim() || "Natfoods";
  const logoUrl = settings?.logoUrl?.trim();
  const primaryColor = settings?.primaryColor || "#1B4332";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = ["Início", "Produtos", "Nossa História", "Contato"] as const;
  const navIds = ["#", "#produtos", "#historia", "#contato"] as const;

  return (
    <nav
      className={`fixed w-full top-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-white/70 backdrop-blur-xl shadow-lg shadow-[#1B4332]/5" : "bg-white/40 backdrop-blur-md"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-2 group">
            <div className="relative flex-shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-8 w-8 object-contain group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <>
                  <Leaf className="h-8 w-8 text-[#1B4332] group-hover:rotate-12 transition-transform duration-300" style={{ color: primaryColor }} />
                  <div className="absolute inset-0 bg-[#FFD166]/20 blur-xl rounded-full group-hover:bg-[#FFD166]/30 transition-all" />
                </>
              )}
            </div>
            <div className="cursor-pointer" onClick={scrollToTop}>
              <h1 className="text-2xl font-bold font-playfair" style={{ color: primaryColor }}>{displayName}</h1>
              <p className="text-xs text-[#6D4C41]/70">Chips da Amazônia</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <a
                key={item}
                href={navIds[index]}
                onClick={(e) => {
                  if (index === 0) {
                    e.preventDefault();
                    scrollToTop();
                  }
                  if (index === 1) {
                    e.preventDefault();
                    scrollToProducts();
                  }
                }}
                className="text-[#6D4C41] hover:text-[#1B4332] transition-all duration-300 font-inter relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#1B4332] to-[#FFD166] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm text-[#1B4332] px-4 py-2.5 rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105 font-inter font-medium border border-[#1B4332]/10"
                  >
                    {user.google_user_data?.picture ? (
                      <img
                        src={user.google_user_data.picture}
                        alt="User Profile"
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                    <span className="hidden md:inline">
                      {user.google_user_data?.given_name || "Conta"}
                    </span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 py-2 z-50">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate("/pedidos");
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2.5 text-[#1B4332] hover:bg-[#FAF8F3] transition-colors font-inter"
                      >
                        <Package className="h-4 w-4" />
                        <span>Meus Pedidos</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors font-inter"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sair</span>
                      </button>
                    </div>
                  )}
                </div>
                <LogoutConfirmModal
                  isOpen={showLogoutModal}
                  onClose={() => setShowLogoutModal(false)}
                  onConfirm={async () => {
                    await logout();
                  }}
                />
              </>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm text-[#1B4332] px-4 py-2.5 rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105 font-inter font-medium border border-[#1B4332]/10"
              >
                <User className="h-5 w-5" />
                <span className="hidden md:inline">Entrar</span>
              </button>
            )}
            <div className="relative">
              <button
                onClick={onOpenCart}
                className="flex items-center space-x-2 bg-gradient-to-r from-[#FFD166] to-[#FFE084] text-[#1B4332] px-6 py-2.5 rounded-full hover:shadow-xl hover:shadow-[#FFD166]/50 transition-all duration-300 hover:scale-105 font-inter font-medium relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFE084] to-[#FFD166] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <ShoppingCart className="h-5 w-5 relative z-10" />
                <span className="relative z-10">Carrinho</span>
              </button>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#1B4332] to-[#2D5F4A] text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg z-10">
                  {itemCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
