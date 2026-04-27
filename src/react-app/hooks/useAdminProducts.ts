import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router";
import { adminApiFetch } from "@/react-app/services/api";
import type { Product } from "@/react-app/types";
import { DEFAULT_CATEGORIES, isStockCritical } from "@/react-app/utils/adminProductDisplay";
import { isProductFeaturedOnHome } from "@/react-app/utils/productFeaturedOnHome";

export const useAdminProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [togglingHomeId, setTogglingHomeId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiFetch<Product[]>("/api/admin/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const editIdFromUrl = searchParams.get("edit");
  useEffect(() => {
    if (!editIdFromUrl || products.length === 0) return;
    const product = products.find((p) => p.id === editIdFromUrl);
    if (product) {
      setEditingProduct(product);
      setModalOpen(true);
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.delete("edit");
          return p;
        },
        { replace: true }
      );
    }
  }, [editIdFromUrl, products, setSearchParams]);

  const categoryOptions = useMemo(() => {
    const fromData = Array.from(
      new Set(products.map((p) => p.category).filter((c): c is string => !!c?.trim()))
    ).sort();
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...fromData]));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    const byCategory = !categoryFilter.trim()
      ? products
      : products.filter((p) => (p.category ?? "").trim() === categoryFilter);
    const filtered = search ? byCategory.filter((p) => p.name.toLowerCase().includes(search)) : byCategory;
    return [...filtered].sort((a, b) => {
      const aCritical = (a.stock ?? 0) <= 5 ? 0 : 1;
      const bCritical = (b.stock ?? 0) <= 5 ? 0 : 1;
      if (aCritical !== bCritical) return aCritical - bCritical;
      return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
    });
  }, [products, categoryFilter, searchQuery]);

  const criticalCount = useMemo(
    () => filteredProducts.filter((p) => isStockCritical(p.stock)).length,
    [filteredProducts]
  );

  const openEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingProduct(null);
  }, []);

  const handleProductCreated = useCallback(() => {
    setToast("Produto cadastrado!");
    void fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = useCallback(
    async (id: string) => {
      await adminApiFetch(`/api/admin/products/${id}`, { method: "DELETE" });
      setProductToDelete(null);
      setToast("Produto excluído.");
      void fetchProducts();
    },
    [fetchProducts]
  );

  const handleToggleStatus = useCallback(
    async (product: Product) => {
      const nextStatus = (product.status ?? "active") === "active" ? "inactive" : "active";
      setTogglingId(product.id);
      try {
        await adminApiFetch(`/api/admin/products/${product.id}`, {
          method: "PUT",
          body: JSON.stringify({ status: nextStatus }),
        });
        await fetchProducts();
      } catch {
        setError("Erro ao atualizar status. Tente novamente.");
      } finally {
        setTogglingId(null);
      }
    },
    [fetchProducts]
  );

  const handleToggleHomeFeatured = useCallback(
    async (product: Product) => {
      const next = !isProductFeaturedOnHome(product);
      setTogglingHomeId(product.id);
      try {
        await adminApiFetch(`/api/admin/products/${product.id}`, {
          method: "PUT",
          body: JSON.stringify({ featured_on_home: next }),
        });
        setToast(next ? "Produto em destaque na home." : "Removido da home.");
        await fetchProducts();
      } catch {
        setError("Erro ao atualizar destaque na home. Tente novamente.");
      } finally {
        setTogglingHomeId(null);
      }
    },
    [fetchProducts]
  );

  return {
    products,
    loading,
    error,
    editingProduct,
    modalOpen,
    addModalOpen,
    setAddModalOpen,
    qrProduct,
    setQrProduct,
    productToDelete,
    setProductToDelete,
    toast,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    categoryOptions,
    filteredProducts,
    criticalCount,
    togglingId,
    togglingHomeId,
    handleToggleHomeFeatured,
    fetchProducts,
    openEdit,
    closeModal,
    handleProductCreated,
    handleDeleteProduct,
    handleToggleStatus,
  };
};
