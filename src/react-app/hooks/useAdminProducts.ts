import { useState, useEffect, useCallback } from "react";

import { useSearchParams } from "react-router";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/react-app/contexts/AuthContext";

import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";

import type { Product } from "@/react-app/types";

import { adminProductsQueryKey } from "@/react-app/query/queryKeys";

import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";

import { isProductFeaturedOnHome } from "@/react-app/utils/productFeaturedOnHome";

import { useAdminProductMutations } from "@/react-app/hooks/admin/useAdminProductMutations";

import { useAdminProductsFilters } from "@/react-app/hooks/admin/useAdminProductsFilters";

import { useToast } from "@/react-app/providers/ToastProvider";



export const useAdminProducts = () => {

  const [searchParams, setSearchParams] = useSearchParams();

  const { user } = useAuth();

  const storeSlug = getEffectiveStoreSlug();

  const mutations = useAdminProductMutations();

  const { showToast } = useToast();



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



  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [qrProduct, setQrProduct] = useState<Product | null>(null);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("");

  const [actionError, setActionError] = useState<string | null>(null);



  const { categoryOptions, filteredProducts, criticalCount } = useAdminProductsFilters(

    products,

    searchQuery,

    categoryFilter,

  );



  const loadError =

    productsQuery.error instanceof Error

      ? productsQuery.error.message

      : productsQuery.error

        ? String(productsQuery.error)

        : null;

  const error = actionError ?? loadError;



  const editIdFromUrl = searchParams.get("edit");

  useEffect(() => {

    if (!editIdFromUrl || products.length === 0) return;

    const product = products.find((p) => p.id === editIdFromUrl);

    if (product) {

      setEditingProduct(product);

      setDrawerMode("edit");

      setSearchParams((prev) => {

        const p = new URLSearchParams(prev);

        p.delete("edit");

        return p;

      }, { replace: true });

    }

  }, [editIdFromUrl, products, setSearchParams]);



  const openCreate = useCallback(() => {

    setEditingProduct(null);

    setDrawerMode("create");

  }, []);



  const openEdit = useCallback((product: Product) => {

    setEditingProduct(product);

    setDrawerMode("edit");

  }, []);



  const closeDrawer = useCallback(() => {

    setDrawerMode(null);

    setEditingProduct(null);

  }, []);



  const handleProductSaved = useCallback(() => {

    showToast({

      type: "success",

      message: drawerMode === "create" ? "Produto cadastrado!" : "Produto atualizado!",

    });

  }, [drawerMode, showToast]);



  const handleDeleteProduct = useCallback(async (id: string) => {

    await mutations.deleteMutation.mutateAsync(id);

    setProductToDelete(null);

    showToast({ type: "success", message: "Produto excluído." });

  }, [mutations.deleteMutation, showToast]);



  const handleToggleStatus = useCallback(async (product: Product) => {

    const nextStatus = (product.status ?? "active") === "active" ? "inactive" : "active";

    setActionError(null);

    try {

      await mutations.toggleStatusMutation.mutateAsync({ productId: product.id, status: nextStatus });

    } catch {

      const message = "Erro ao atualizar status. Tente novamente.";

      setActionError(message);

      showToast({ type: "error", message });

    }

  }, [mutations.toggleStatusMutation, showToast]);



  const handleToggleHomeFeatured = useCallback(async (product: Product) => {

    const next = !isProductFeaturedOnHome(product);

    setActionError(null);

    try {

      await mutations.toggleHomeFeaturedMutation.mutateAsync({ productId: product.id, featured: next });

      showToast({

        type: "success",

        message: next ? "Produto em destaque na home." : "Removido da home.",

      });

    } catch {

      const message = "Erro ao atualizar destaque na home.";

      setActionError(message);

      showToast({ type: "error", message });

    }

  }, [mutations.toggleHomeFeaturedMutation, showToast]);



  return {

    products,

    loading,

    error,

    drawerMode,

    editingProduct,

    drawerOpen: drawerMode !== null,

    qrProduct,

    setQrProduct,

    productToDelete,

    setProductToDelete,

    searchQuery,

    setSearchQuery,

    categoryFilter,

    setCategoryFilter,

    categoryOptions,

    filteredProducts,

    criticalCount,

    togglingId: mutations.toggleStatusMutation.isPending ? mutations.toggleStatusMutation.variables?.productId ?? null : null,

    togglingHomeId: mutations.toggleHomeFeaturedMutation.isPending ? mutations.toggleHomeFeaturedMutation.variables?.productId ?? null : null,

    fetchProducts: () => void productsQuery.refetch(),

    openCreate,

    openEdit,

    closeDrawer,

    handleProductSaved,

    handleDeleteProduct,

    handleToggleStatus,

    handleToggleHomeFeatured,

  };

};

