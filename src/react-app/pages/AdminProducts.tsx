import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { RefreshCw, Home, Package, Pencil, ImageOff, Search, Plus, AlertTriangle } from "lucide-react";
import { adminApiFetch } from "@/react-app/lib/api";
import type { Product } from "@/react-app/types";
import { AdminNav } from "@/react-app/components/admin/AdminNav";
import { EditProductModal } from "@/react-app/components/admin/EditProductModal";
import { AddProductModal } from "@/react-app/components/admin/AddProductModal";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const DEFAULT_CATEGORIES = ["Salgados", "Doces", "Combos"];

/** Exibe e considera stock null como 0 (estoque crítico ≤ 5). */
const displayStock = (stock: number | null | undefined) => stock ?? 0;
const isStockCritical = (stock: number | null | undefined) => displayStock(stock) <= 5;

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
      <div className="max-w-5xl mx-auto">
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Novo Produto
            </button>
            <AdminNav />
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-white/80 hover:bg-white border border-[#1B4332]/20 text-[#1B4332] px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm disabled:opacity-60"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 mb-6 font-inter">
            {error}
          </div>
        )}

        {loading && products.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 text-center shadow-xl border border-white/50">
            <RefreshCw className="h-12 w-12 text-[#1B4332] animate-spin mx-auto mb-4" />
            <p className="text-[#6D4C41] font-inter">Carregando produtos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 text-center shadow-xl border border-white/50">
            <p className="text-[#6D4C41] font-inter">Nenhum produto cadastrado.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3 font-inter">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nome..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm shadow-sm focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                  aria-label="Buscar produto por nome"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="category-filter" className="text-sm font-medium text-[#6D4C41]">
                  Categoria:
                </label>
                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                >
                  <option value="">Todas</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {criticalCount > 0 && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-red-800 font-inter">
                <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-600" aria-hidden />
                <span className="font-semibold">
                  {criticalCount} produto(s) com estoque crítico (≤ 5 unidades) — priorize a reposição.
                </span>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm">
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
                        <td className="py-3 px-4 text-slate-800 font-medium">{product.name}</td>
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
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            className="inline-flex items-center gap-1.5 text-[#1B4332] hover:bg-[#1B4332]/10 px-3 py-2 rounded-xl font-medium transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </button>
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
