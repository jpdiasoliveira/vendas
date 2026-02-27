import { useState, useEffect } from 'react';
import { Leaf, User, Package, LogOut, ShoppingCart } from 'lucide-react';
import { useCart } from '@/react-app/contexts/CartContext';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import CartModal from '@/react-app/components/checkout/CartModal';
import LoginModal from '@/react-app/components/LoginModal';

// Imported modular components
import { Hero } from '@/react-app/components/home/Hero';
import { ProductGrid } from '@/react-app/components/home/ProductGrid';
import { Story } from '@/react-app/components/home/Story';
import { Lifestyle } from '@/react-app/components/home/Lifestyle';
import { Benefits } from '@/react-app/components/home/Benefits';
import { Newsletter } from '@/react-app/components/home/Newsletter';
import { Footer } from '@/react-app/components/home/Footer';
import { useProducts } from '@/react-app/hooks/useProducts';

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { products, loading, error } = useProducts();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToProducts = () => {
    const productsSection = document.getElementById('produtos');
    if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3]">
      {/* Dynamic Navigation Navbar */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/70 backdrop-blur-xl shadow-lg shadow-[#1B4332]/5' : 'bg-white/40 backdrop-blur-md'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2 group">
              <div className="relative">
                <Leaf className="h-8 w-8 text-[#1B4332] group-hover:rotate-12 transition-transform duration-300" />
                <div className="absolute inset-0 bg-[#FFD166]/20 blur-xl rounded-full group-hover:bg-[#FFD166]/30 transition-all"></div>
              </div>
              <div className="cursor-pointer" onClick={scrollToTop}>
                <h1 className="text-2xl font-bold text-[#1B4332] font-playfair">Natfoods</h1>
                <p className="text-xs text-[#6D4C41]/70">Chips da Amazônia</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              {['Início', 'Produtos', 'Nossa História', 'Contato'].map((item, index) => {
                const ids = ['#', '#produtos', '#historia', '#contato'];
                return (
                  <a key={item} href={ids[index]} onClick={(e) => { if (index === 0) { e.preventDefault(); scrollToTop(); } }} className="text-[#6D4C41] hover:text-[#1B4332] transition-all duration-300 font-inter relative group">
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#1B4332] to-[#FFD166] group-hover:w-full transition-all duration-300"></span>
                  </a>
                );
              })}
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative">
                  <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm text-[#1B4332] px-4 py-2.5 rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105 font-inter font-medium border border-[#1B4332]/10">
                    {user.google_user_data?.picture ? <img src={user.google_user_data.picture} alt="User Profile" className="h-6 w-6 rounded-full" /> : <User className="h-5 w-5" />}
                    <span className="hidden md:inline">{user.google_user_data?.given_name || 'Conta'}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 py-2 z-50">
                      <button onClick={() => { setShowUserMenu(false); navigate('/pedidos'); }} className="w-full flex items-center space-x-2 px-4 py-2.5 text-[#1B4332] hover:bg-[#FAF8F3] transition-colors font-inter">
                        <Package className="h-4 w-4" /><span>Meus Pedidos</span>
                      </button>
                      <button onClick={async () => { await logout(); setShowUserMenu(false); }} className="w-full flex items-center space-x-2 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors font-inter">
                        <LogOut className="h-4 w-4" /><span>Sair</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => setShowLoginModal(true)} className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm text-[#1B4332] px-4 py-2.5 rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105 font-inter font-medium border border-[#1B4332]/10">
                  <User className="h-5 w-5" /><span className="hidden md:inline">Entrar</span>
                </button>
              )}
              <div className="relative">
                <button onClick={() => setIsCartOpen(true)} className="flex items-center space-x-2 bg-gradient-to-r from-[#FFD166] to-[#FFE084] text-[#1B4332] px-6 py-2.5 rounded-full hover:shadow-xl hover:shadow-[#FFD166]/50 transition-all duration-300 hover:scale-105 font-inter font-medium relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FFE084] to-[#FFD166] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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

      {/* Page Sections */}
      <Hero onShopClick={scrollToProducts} />
      <ProductGrid products={products} loading={loading} error={error} />
      <Story />
      <Lifestyle />
      <Benefits />
      <Newsletter />
      <Footer />

      {/* Modals */}
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}
