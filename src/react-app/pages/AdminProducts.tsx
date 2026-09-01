import { useEffect } from "react";
import { useOutletContext } from "react-router";
import { RefreshCw } from "lucide-react";
import type { AdminCatalogHubOutletContext } from "@/react-app/components/admin/adminCatalogHubOutletContext";
import { ProductQRModal } from "@/react-app/components/admin/ProductQRModal";
import { DeleteProductModal } from "@/react-app/components/admin/DeleteProductModal";
import { AdminProductsFilters } from "@/react-app/components/admin/products/AdminProductsFilters";
import { AdminProductsTable } from "@/react-app/components/admin/products/AdminProductsTable";
import { AdminProductDrawer } from "@/react-app/components/admin/products/AdminProductDrawer";
import { useAdminProducts } from "@/react-app/hooks/useAdminProducts";
import { useTrendingProductIds } from "@/react-app/hooks/useTrendingProductIds";
import { useCapabilities } from "@/react-app/hooks/useCapabilities";
import { useAdminRoleGate } from "@/react-app/hooks/admin/useAdminRoleGate";

const AdminProductsPage = () => {
  const m = useAdminProducts();
  const { setCatalogHubToolbar } = useOutletContext<AdminCatalogHubOutletContext>();
  const trendingProductIds = useTrendingProductIds();
  const { isAtProductLimit, capabilities } = useCapabilities();
  const productLimitReached = isAtProductLimit(m.products.length);
  const { isAdminOrOwner } = useAdminRoleGate();

  useEffect(() => {
    setCatalogHubToolbar(
      <button
        type="button"
        onClick={() => void m.fetchProducts()}
        disabled={m.loading}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-brand-primary/20 bg-surface-elevated px-3 py-2 text-sm font-medium text-content-muted transition hover:bg-surface-muted hover:text-content disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 shrink-0 ${m.loading ? "animate-spin" : ""}`} />
        Atualizar
      </button>,
    );
    return () => setCatalogHubToolbar(null);
  }, [m.fetchProducts, m.loading, setCatalogHubToolbar]);

  return (
    <>
      {m.error ? (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">{m.error}</div>
      ) : null}

      {m.loading && m.products.length === 0 ? (
        <div className="rounded-2xl border border-brand-primary/10 bg-surface-elevated p-12 text-center">
          <RefreshCw className="mx-auto mb-4 h-12 w-12 animate-spin text-brand-primary" />
          <p className="text-content-muted">Carregando produtos...</p>
        </div>
      ) : m.products.length === 0 ? (
        <div className="rounded-2xl border border-brand-primary/10 bg-surface-elevated p-12 text-center">
          <p className="text-content-muted">Nenhum produto cadastrado.</p>
        </div>
      ) : (
        <>
          <AdminProductsFilters
            searchQuery={m.searchQuery}
            setSearchQuery={m.setSearchQuery}
            categoryFilter={m.categoryFilter}
            setCategoryFilter={m.setCategoryFilter}
            categoryOptions={m.categoryOptions}
            criticalCount={m.criticalCount}
            onNewProduct={m.openCreate}
            newProductDisabled={productLimitReached}
            newProductDisabledTitle={productLimitReached ? `Limite do plano: ${capabilities.maxProducts ?? "?"} produtos.` : undefined}
          />
          <AdminProductsTable
            products={m.filteredProducts}
            trendingProductIds={trendingProductIds}
            togglingId={m.togglingId}
            togglingHomeId={m.togglingHomeId}
            onToggleStatus={m.handleToggleStatus}
            onToggleHomeFeatured={m.handleToggleHomeFeatured}
            onQr={m.setQrProduct}
            onEdit={m.openEdit}
            onDelete={m.setProductToDelete}
            canDelete={isAdminOrOwner}
          />
        </>
      )}

      <AdminProductDrawer
        mode={m.drawerMode === "edit" ? "edit" : "create"}
        isOpen={m.drawerOpen}
        product={m.editingProduct}
        onClose={m.closeDrawer}
        onSaved={m.handleProductSaved}
        productLimitReached={productLimitReached}
      />

      {m.qrProduct ? (
        <ProductQRModal
          isOpen
          productName={m.qrProduct.name}
          productId={m.qrProduct.id}
          editUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/admin/produtos/catalogo?edit=${m.qrProduct.id}`}
          onClose={() => m.setQrProduct(null)}
        />
      ) : null}

      {m.productToDelete ? (
        <DeleteProductModal
          isOpen
          productName={m.productToDelete.name}
          productId={m.productToDelete.id}
          onClose={() => m.setProductToDelete(null)}
          onConfirm={m.handleDeleteProduct}
        />
      ) : null}
    </>
  );
};

export default AdminProductsPage;
