import { useState, useEffect } from "react";
import { X, Loader2, Save } from "lucide-react";
import { apiFetch } from "@/react-app/lib/api";
import type { Product } from "@/react-app/types";

interface EditProductModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditProductModal({ isOpen, product, onClose, onSaved }: EditProductModalProps) {
  const [price, setPrice] = useState("");
  const [priceWholesale, setPriceWholesale] = useState("");
  const [minQuantityWholesale, setMinQuantityWholesale] = useState("");
  const [stock, setStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    setPrice(String(product.price ?? ""));
    setPriceWholesale(product.priceWholesale != null ? String(product.priceWholesale) : "");
    setMinQuantityWholesale(
      product.minQuantityWholesale != null ? String(product.minQuantityWholesale) : ""
    );
    setStock(product.stock != null ? String(product.stock) : "");
    setError(null);
  }, [product]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSaving(true);
    setError(null);
    try {
      const p = Number.parseFloat(price);
      if (Number.isNaN(p) || p < 0) {
        setError("Preço varejo inválido.");
        setSaving(false);
        return;
      }
      const pw = priceWholesale === "" ? null : Number.parseFloat(priceWholesale);
      const mq = minQuantityWholesale === "" ? null : Number.parseInt(minQuantityWholesale, 10);
      const s = stock === "" ? null : Number.parseInt(stock, 10);

      const payload = {
        price: p,
        priceWholesale: priceWholesale === "" ? null : (Number.isNaN(pw as number) ? undefined : pw),
        minQuantityWholesale:
          minQuantityWholesale === "" ? null : (Number.isNaN(mq as number) ? undefined : mq),
        stock: stock === "" ? null : (Number.isNaN(s as number) ? undefined : s),
      };

      await apiFetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1B4332]/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-white/50 max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-[#1B4332]/10">
          <h2 className="text-xl font-bold text-[#1B4332] font-playfair">
            Editar produto {product?.name ?? ""}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#6D4C41] hover:text-[#1B4332] hover:bg-[#1B4332]/5 rounded-xl transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 font-inter space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#6D4C41] mb-1">Preço (Varejo) R$</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-[#1B4332]/20 px-4 py-2 text-[#1B4332]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6D4C41] mb-1">
              Preço Atacado R$ (opcional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={priceWholesale}
              onChange={(e) => setPriceWholesale(e.target.value)}
              className="w-full rounded-xl border border-[#1B4332]/20 px-4 py-2 text-[#1B4332]"
              placeholder="—"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6D4C41] mb-1">
              Qtd. mínima atacado (opcional)
            </label>
            <input
              type="number"
              min="0"
              value={minQuantityWholesale}
              onChange={(e) => setMinQuantityWholesale(e.target.value)}
              className="w-full rounded-xl border border-[#1B4332]/20 px-4 py-2 text-[#1B4332]"
              placeholder="—"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6D4C41] mb-1">Estoque</label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full rounded-xl border border-[#1B4332]/20 px-4 py-2 text-[#1B4332]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#1B4332]/20 text-[#6D4C41] font-medium hover:bg-[#1B4332]/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1B4332] text-white py-2.5 rounded-xl font-medium hover:bg-[#2D5F4A] disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
