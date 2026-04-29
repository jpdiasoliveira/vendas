import { useNavigate } from "react-router";
import { RefreshCw, Home, Package } from "lucide-react";
import { EditProductModal } from "@/react-app/components/admin/EditProductModal";
import { AddProductModal } from "@/react-app/components/admin/AddProductModal";
import { ProductQRModal } from "@/react-app/components/admin/ProductQRModal";
import { DeleteProductModal } from "@/react-app/components/admin/DeleteProductModal";
import { AdminProductsToolbar } from "@/react-app/components/admin/AdminProductsToolbar";
import { AdminProductsTable } from "@/react-app/components/admin/AdminProductsTable";
import { useAdminProducts } from "@/react-app/hooks/useAdminProducts";
import { useTrendingProductIds } from "@/react-app/hooks/useTrendingProductIds";
import { useCapabilities } from "@/react-app/hooks/useCapabilities";

const AdminProductsPage = () => {
  const navigate = useNavigate();
  const m = useAdminProducts();
  const trendingProductIds = useTrendingProductIds();
  const { isAtProductLimit, capabilities } = useCapabilities();
  const productLimitReached = isAtProductLimit(m.products.length);
  const newProductLimitTitle = productLimitReached
    ? `Limite do plano: ${capabilities.maxProducts ?? "?"} produtos.`
    : undefined;

  return (
    <div className="px-2.5 pb-12 pt-6 sm:px-3 lg:px-4">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-full border border-[#1B4332]/10 bg-white/60 p-2 text-[#6D4C41] shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-[#1B4332]"
              aria-label="Voltar"
            >
              <Home className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-[#1B4332]" />
              <div>
                <h1 className="font-playfair text-2xl font-bold text-[#1B4332]">Gestão de Produtos</h1>
                <p className="font-inter text-sm text-[#6D4C41]">Preços, atacado e estoque</p>
              </div>
            </div>
          </div>
          <div className="flex w-full min-w-0 justify-end sm:w-auto">
            <button
              type="button"
              onClick={() => void m.fetchProducts()}
              disabled={m.loading}
              className="inline-flex items-center gap-2 rounded-xl border border-[#1B4332]/20 bg-white/80 px-4 py-2.5 font-medium text-[#1B4332] shadow-sm transition-all hover:bg-white disabled:opacity-60"
            >
              <RefreshCw className={`h-5 w-5 ${m.loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
        </div>

        {m.error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-inter text-red-700">{m.error}</div>
        )}

        {m.loading && m.products.length === 0 ? (
          <div className="rounded-2xl border border-[#1B4332]/10 bg-white/70 p-12 text-center shadow-sm backdrop-blur-sm">
            <RefreshCw className="mx-auto mb-4 h-12 w-12 animate-spin text-[#1B4332]" />
            <p className="font-inter text-[#6D4C41]">Carregando produtos...</p>
          </div>
        ) : m.products.length === 0 ? (
          <div className="rounded-2xl border border-[#1B4332]/10 bg-white/70 p-12 text-center shadow-sm backdrop-blur-sm">
            <p className="font-inter text-[#6D4C41]">Nenhum produto cadastrado.</p>
          </div>
        ) : (
          <>
            <AdminProductsToolbar
              searchQuery={m.searchQuery}
              setSearchQuery={m.setSearchQuery}
              categoryFilter={m.categoryFilter}
              setCategoryFilter={m.setCategoryFilter}
              categoryOptions={m.categoryOptions}
              criticalCount={m.criticalCount}
              onNewProduct={() => m.setAddModalOpen(true)}
              newProductDisabled={productLimitReached}
              newProductDisabledTitle={newProductLimitTitle}
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
            />
          </>
        )}
      </div>

      <EditProductModal isOpen={m.modalOpen} product={m.editingProduct} onClose={m.closeModal} onSaved={m.fetchProducts} />
      <AddProductModal
        isOpen={m.addModalOpen}
        onClose={() => m.setAddModalOpen(false)}
        onSaved={m.handleProductCreated}
        catalogProductCount={m.products.length}
      />
      {m.qrProduct && (
        <ProductQRModal
          isOpen={!!m.qrProduct}
          productName={m.qrProduct.name}
          productId={m.qrProduct.id}
          editUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/admin/products?edit=${m.qrProduct.id}`}
          onClose={() => m.setQrProduct(null)}
        />
      )}
      {m.productToDelete && (
        <DeleteProductModal
          isOpen={!!m.productToDelete}
          productName={m.productToDelete.name}
          productId={m.productToDelete.id}
          onClose={() => m.setProductToDelete(null)}
          onConfirm={m.handleDeleteProduct}
        />
      )}
      {m.toast && (
        <div
          role="status"
          aria-live="polite"
          className="animate-in fade-in fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-[#1B4332] px-6 py-3 font-inter font-medium text-white shadow-lg duration-300"
        >
          {m.toast}
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
