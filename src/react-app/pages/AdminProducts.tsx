import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { RefreshCw, Home, Package, Pencil, ImageOff, Search, Plus, AlertTriangle, QrCode, HelpCircle, Trash2, Flame } from "lucide-react";
import { adminApiFetch } from "@/react-app/services/api";
import type { Product } from "@/react-app/types";
import { AdminNav } from "@/react-app/components/admin/AdminNav";
import { EditProductModal } from "@/react-app/components/admin/EditProductModal";
import { AddProductModal } from "@/react-app/components/admin/AddProductModal";
import { ProductQRModal } from "@/react-app/components/admin/ProductQRModal";
import { DeleteProductModal } from "@/react-app/components/admin/DeleteProductModal";

import { formatCurrency } from "@/react-app/utils/format";
import { useTrendingProductIds } from "@/react-app/hooks/useTrendingProductIds";

const DEFAULT_CATEGORIES = ["Salgados", "Doces", "Combos"];

/** Exibe e considera stock null como 0 (estoque crítico ≤ 5). */
const displayStock = (stock: number | null | undefined) => stock ?? 0;
const isStockCritical = (stock: number | null | undefined) => displayStock(stock) <= 5;

const QR_TOOLTIP =
  "Gere um QR Code para colar na prateleira. Ao escanear, você abre a edição deste produto instantaneamente.";

export default function AdminProductsPage() {
  const navigate = useNavigate();
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
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const trendingProductIds = useTrendingProductIds();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchProducts = async () => {
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
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const editIdFromUrl = searchParams.get("edit");
  useEffect(() => {
    if (!editIdFromUrl || products.length === 0) return;
    const product = products.find((p) => p.id === editIdFromUrl);
    if (product) {
      setEditingProduct(product);
      setModalOpen(true);
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.delete("edit");
        return p;
      }, { replace: true });
    }
  }, [editIdFromUrl, products, setSearchParams]);

  const categoryOptions = useMemo(() => {
    const fromData = Array.from(
      new Set(products.map((p) => p.category).filter((c): c is string => !!c?.trim()))
    ).sort();
    const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...fromData]));
    return combined;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    const byCategory =
      !categoryFilter.trim()
        ? products
        : products.filter((p) => (p.category ?? "").trim() === categoryFilter);
    const filtered = search
      ? byCategory.filter((p) => p.name.toLowerCase().includes(search))
      : byCategory;
    // Ordenação inteligente: críticos (stock <= 5) sempre no topo; dentro de cada grupo, ordem alfabética
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

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleProductCreated = () => {
    setToast("Produto cadastrado!");
    fetchProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    await adminApiFetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setProductToDelete(null);
    setToast("Produto excluído.");
    fetchProducts();
  };

  const handleToggleStatus = async (product: Product) => {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 bg-white/60 backdrop-blur-sm rounded-full text-[#6D4C41] hover:text-[#1B4332] hover:bg-white transition-all shadow-sm border border-[#1B4332]/10"
              aria-label="Voltar"
            >
              <Home className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-[#1B4332]" />
              <div>
                <h1 className="text-2xl font-bold text-[#1B4332] font-playfair">
                  Gestão de Produtos
                </h1>
                <p className="text-sm text-[#6D4C41] font-inter">
                  Preços, atacado e estoque
                </p>
              </div>
            </div>
          </div>
          <div className="w-full min-w-0 sm:w-auto">
            <AdminNav>
              <button
                type="button"
                onClick={() => void fetchProducts()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-[#1B4332]/20 bg-white/80 px-4 py-2.5 font-medium text-[#1B4332] shadow-sm transition-all hover:bg-white disabled:opacity-60"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </button>
            </AdminNav>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 mb-6 font-inter">
            {error}
          </div>
        )}

        {loading && products.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 text-center shadow-sm border border-[#1B4332]/10">
            <RefreshCw className="h-12 w-12 text-[#1B4332] animate-spin mx-auto mb-4" />
            <p className="text-[#6D4C41] font-inter">Carregando produtos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 text-center shadow-sm border border-[#1B4332]/10">
            <p className="text-[#6D4C41] font-inter">Nenhum produto cadastrado.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-nowrap items-center gap-4 font-inter">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nome..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#1B4332]/20 bg-white/80 text-[#1B4332] text-sm shadow-sm focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                  aria-label="Buscar produto por nome"
                />
              </div>
              <div className="w-44 shrink-0">
                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-xl border border-[#1B4332]/20 bg-white/80 px-3 py-2 text-sm text-[#1B4332] shadow-sm focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                  aria-label="Filtrar por categoria"
                >
                  <option value="">Todas</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setAddModalOpen(true)}
                className="shrink-0 inline-flex items-center gap-2 bg-[#EAD7BB] hover:bg-[#EAD7BB]/90 text-[#6D4C41] px-4 py-2.5 rounded-xl font-medium transition-colors border border-[#1B4332]/10 shadow-sm"
              >
                <Plus className="h-5 w-5" />
                Novo Produto
              </button>
            </div>

            {criticalCount > 0 && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-red-800 font-inter">
                <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-600" aria-hidden />
                <span className="font-semibold">
                  {criticalCount} produto(s) com estoque crítico (≤ 5 unidades) — priorize a reposição.
                </span>
              </div>
            )}

            <div className="rounded-2xl border border-[#1B4332]/10 overflow-hidden bg-white/70 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full font-inter">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-slate-700 font-semibold w-20">Foto</th>
                      <th className="text-left py-3 px-4 text-slate-700 font-semibold">Nome</th>
                      <th className="text-right py-3 px-4 text-slate-700 font-semibold">Preço</th>
                      <th className="text-right py-3 px-4 text-slate-700 font-semibold">Estoque</th>
                      <th className="text-left py-3 px-4 text-slate-700 font-semibold">Status</th>
                      <th className="w-24 py-3 px-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const critical = isStockCritical(product.stock);
                      return (
                      <tr
                        key={product.id}
                        className={`border-b border-slate-200 last:border-b-0 transition-colors ${
                          critical
                            ? "bg-red-50/90 hover:bg-red-100/90 border-l-4 border-l-red-500"
                            : "bg-slate-50 hover:bg-slate-100/50"
                        }`}
                      >
                        <td className="py-3 px-4">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt=""
                              className="h-12 w-12 object-cover rounded-full border-2 border-slate-200"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full border-2 border-slate-200 bg-slate-200 flex items-center justify-center text-slate-400">
                              <ImageOff className="h-6 w-6" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            {trendingProductIds.includes(product.id) && (
                              <Flame
                                className="h-4 w-4 text-amber-500 shrink-0"
                                aria-label="Top vendas"
                                title="Top vendas"
                              />
                            )}
                            {product.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-800 font-medium">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={
                              isStockCritical(product.stock)
                                ? "text-red-600 font-bold"
                                : "text-slate-700"
                            }
                          >
                            {displayStock(product.stock)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={(product.status ?? "active") === "active"}
                              disabled={togglingId === product.id}
                              onClick={() => handleToggleStatus(product)}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                (product.status ?? "active") === "active"
                                  ? "bg-[#1B4332]"
                                  : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  (product.status ?? "active") === "active"
                                    ? "translate-x-5"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                            <span className="text-sm text-slate-700">
                              {(product.status ?? "active") === "active" ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setQrProduct(product)}
                              className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Gerar QR Code"
                              aria-label={`Gerar QR Code para ${product.name}`}
                            >
                              <QrCode className="h-4 w-4" />
                            </button>
                            <span
                              className="text-slate-400 hover:text-slate-600 cursor-help"
                              title={QR_TOOLTIP}
                              aria-label={QR_TOOLTIP}
                            >
                              <HelpCircle className="h-4 w-4" strokeWidth={2.5} />
                            </span>
                            <button
                              type="button"
                              onClick={() => openEdit(product)}
                              className="inline-flex items-center gap-1.5 text-[#1B4332] hover:bg-[#1B4332]/10 px-3 py-2 rounded-xl font-medium transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductToDelete(product)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir produto"
                              aria-label={`Excluir ${product.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ); })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <EditProductModal
        isOpen={modalOpen}
        product={editingProduct}
        onClose={closeModal}
        onSaved={fetchProducts}
      />

      <AddProductModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSaved={handleProductCreated}
      />

      {qrProduct && (
        <ProductQRModal
          isOpen={!!qrProduct}
          productName={qrProduct.name}
          productId={qrProduct.id}
          editUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/admin/products?edit=${qrProduct.id}`}
          onClose={() => setQrProduct(null)}
        />
      )}

      {productToDelete && (
        <DeleteProductModal
          isOpen={!!productToDelete}
          productName={productToDelete.name}
          productId={productToDelete.id}
          onClose={() => setProductToDelete(null)}
          onConfirm={handleDeleteProduct}
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-[#1B4332] text-white rounded-xl shadow-lg font-inter font-medium animate-in fade-in duration-300"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
