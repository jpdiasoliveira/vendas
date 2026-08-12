import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router";
import { useProducts } from "@/react-app/hooks/useProducts";
import { useTrendingProductIds } from "@/react-app/hooks/useTrendingProductIds";
import { useToast } from "@/react-app/providers/ToastProvider";

export function useHomePage() {
  const location = useLocation();
  const prevPathRef = useRef<string | null>(null);
  const { showToast } = useToast();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [guestOrderLookupOpen, setGuestOrderLookupOpen] = useState(false);

  const { products, loading, error, refetch } = useProducts();
  const trendingProductIds = useTrendingProductIds();

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = location.pathname;
    if (location.pathname !== "/") return;
    if (prev !== null && prev !== "/") void refetch();
  }, [location.pathname, refetch]);

  useEffect(() => {
    if (!error) return;
    showToast({ type: "error", message: error });
  }, [error, showToast]);

  const scrollToProducts = useCallback(() => {
    const el = document.getElementById("produtos");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return {
    products,
    loading,
    error,
    trendingProductIds,
    isCartOpen,
    setIsCartOpen,
    showLoginModal,
    setShowLoginModal,
    guestOrderLookupOpen,
    setGuestOrderLookupOpen,
    scrollToProducts,
    scrollToTop,
    refetch,
  };
}
