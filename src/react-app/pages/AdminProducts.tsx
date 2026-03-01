import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { RefreshCw, Home, Package, Pencil } from "lucide-react";
import { apiFetch } from "@/react-app/lib/api";
import type { Product } from "@/react-app/types";
import { AdminNav } from "@/react-app/components/admin/AdminNav";
import { EditProductModal } from "@/react-app/components/admin/EditProductModal";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Product[]>("/api/admin/products");
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

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
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
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full font-inter">
                <thead>
                  <tr className="bg-[#1B4332]/5 border-b border-[#1B4332]/10">
                    <th className="text-left py-4 px-4 text-[#1B4332] font-semibold">Produto</th>
                    <th className="text-right py-4 px-4 text-[#1B4332] font-semibold">Estoque</th>
                    <th className="text-right py-4 px-4 text-[#1B4332] font-semibold">Preço varejo</th>
                    <th className="text-right py-4 px-4 text-[#1B4332] font-semibold">Preço atacado</th>
                    <th className="text-right py-4 px-4 text-[#1B4332] font-semibold">Qtd. mín. atacado</th>
                    <th className="w-24 py-4 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-[#1B4332]/5 hover:bg-[#FAF8F3]/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-[#1B4332] font-medium">{product.name}</td>
                      <td className="py-4 px-4 text-right text-[#6D4C41]">
                        {product.stock ?? "—"}
                      </td>
                      <td className="py-4 px-4 text-right text-[#1B4332] font-medium">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="py-4 px-4 text-right text-[#6D4C41]">
                        {product.priceWholesale != null
                          ? formatCurrency(product.priceWholesale)
                          : "—"}
                      </td>
                      <td className="py-4 px-4 text-right text-[#6D4C41]">
                        {product.minQuantityWholesale ?? "—"}
                      </td>
                      <td className="py-4 px-4">
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <EditProductModal
        isOpen={modalOpen}
        product={editingProduct}
        onClose={closeModal}
        onSaved={fetchProducts}
      />
    </div>
  );
}
