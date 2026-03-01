import { useState } from "react";
import CartModal from "@/react-app/components/checkout/CartModal";
import LoginModal from "@/react-app/components/LoginModal";
import { Navbar } from "@/react-app/components/layout/Navbar";
import { Footer } from "@/react-app/components/layout/Footer";
import { Hero } from "@/react-app/components/home/Hero";
import { ProductGrid } from "@/react-app/components/home/ProductGrid";
import { Story } from "@/react-app/components/home/Story";
import { Lifestyle } from "@/react-app/components/home/Lifestyle";
import { Benefits } from "@/react-app/components/home/Benefits";
import { Newsletter } from "@/react-app/components/home/Newsletter";
import { useProducts } from "@/react-app/hooks/useProducts";

export default function HomePage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { products, loading, error } = useProducts();

  const scrollToProducts = () => {
    const el = document.getElementById("produtos");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3]">
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenLogin={() => setShowLoginModal(true)}
        scrollToProducts={scrollToProducts}
        scrollToTop={scrollToTop}
      />

      <Hero onShopClick={scrollToProducts} />
      <ProductGrid products={products} loading={loading} error={error} />
      <Story />
      <Lifestyle />
      <Benefits />
      <Newsletter />
      <Footer />

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}
