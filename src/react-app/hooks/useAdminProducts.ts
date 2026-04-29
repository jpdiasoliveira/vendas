import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import type { Product } from "@/react-app/types";
import { adminProductsQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";
import { DEFAULT_CATEGORIES, isStockCritical } from "@/react-app/utils/adminProductDisplay";
import { isProductFeaturedOnHome } from "@/react-app/utils/productFeaturedOnHome";

export const useAdminProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const storeSlug = getEffectiveStoreSlug();

  const productsQuery = useQuery({
    queryKey: adminProductsQueryKey(storeSlug || "_"),
    queryFn: () => adminApiFetch<Product[]>("/api/admin/products"),
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    retry: false,
    enabled: !!user,
  });

  const products = productsQuery.data ?? [];
  const loading = productsQuery.isPending && productsQuery.data === undefined;

  const fetchProducts = useCallback(() => {
    void productsQuery.refetch();
  }, [productsQuery]);

  const invalidateProducts = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
  }, [queryClient]);

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
  const [actionError, setActionError] = useState<string | null>(null);

  const loadError =
    productsQuery.error instanceof Error
      ? productsQuery.error.message
      : productsQuery.error
        ? String(productsQuery.error)
        : null;
  const error = actionError ?? loadError;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

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
    invalidateProducts();
  }, [invalidateProducts]);

  const handleDeleteProduct = useCallback(
    async (id: string) => {
      await adminApiFetch(`/api/admin/products/${id}`, { method: "DELETE" });
      setProductToDelete(null);
      setToast("Produto excluído.");
      invalidateProducts();
    },
    [invalidateProducts]
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
        invalidateProducts();
      } catch {
        setActionError("Erro ao atualizar status. Tente novamente.");
      } finally {
        setTogglingId(null);
      }
    },
    [invalidateProducts]
  );

  const handleToggleHomeFeatured = useCallback(
    async (product: Product) => {
      const next = !isProductFeaturedOnHome(product);
      setTogglingHomeId(product.id);
      setActionError(null);
      try {
        await adminApiFetch(`/api/admin/products/${product.id}`, {
          method: "PUT",
          body: JSON.stringify({ featured_on_home: next }),
        });
        setToast(next ? "Produto em destaque na home." : "Removido da home.");
        invalidateProducts();
      } catch {
        setActionError("Erro ao atualizar destaque na home. Tente novamente.");
      } finally {
        setTogglingHomeId(null);
      }
    },
    [invalidateProducts]
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
