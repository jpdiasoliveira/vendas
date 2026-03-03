import { useState } from "react";
import { X, Loader2, Save } from "lucide-react";
import { adminApiFetch } from "@/react-app/lib/api";

const CATEGORIES = ["Salgados", "Doces", "Combos"];

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddProductModal({ isOpen, onClose, onSaved }: AddProductModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; price?: string }>({});

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    setPrice("");
    setStock("0");
    setCategory("");
    setImageUrl("");
    setStatus("active");
    setError(null);
    setFieldErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const nameTrim = name.trim();
    const priceNum = Number.parseFloat(price.replace(",", "."));

    const errors: { name?: string; price?: string } = {};
    if (!nameTrim) errors.name = "Nome do produto é obrigatório.";
    if (Number.isNaN(priceNum) || priceNum < 0) errors.price = "Preço deve ser um número positivo.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const stockInt = Math.max(0, Math.floor(Number.parseFloat(stock.replace(",", ".")) || 0));
      await adminApiFetch("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          title: nameTrim,
          price: priceNum,
          stock: stockInt,
          category: category.trim() || undefined,
          image_url: imageUrl.trim() || "",
          status,
        }),
      });
      resetForm();
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar produto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#1B4332]/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-white/50 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#1B4332]/10">
          <h2 className="text-xl font-bold text-[#1B4332] font-playfair">Novo Produto</h2>
          <button
            type="button"
            onClick={handleClose}
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
            <label className="block text-sm font-medium text-[#6D4C41] mb-1">
              Nome do Produto <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full rounded-xl border px-4 py-2 text-[#1B4332] ${
                fieldErrors.name
                  ? "border-red-500 bg-red-50/50"
                  : "border-[#1B4332]/20"
              }`}
              placeholder="Ex: Chips de Banana"
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
            />
            {fieldErrors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6D4C41] mb-1">
              Preço (R$) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={`w-full rounded-xl border px-4 py-2 text-[#1B4332] ${
                fieldErrors.price
                  ? "border-red-500 bg-red-50/50"
                  : "border-[#1B4332]/20"
              }`}
              placeholder="0,00"
              aria-invalid={!!fieldErrors.price}
              aria-describedby={fieldErrors.price ? "price-error" : undefined}
            />
            {fieldErrors.price && (
              <p id="price-error" className="mt-1 text-sm text-red-600">
                {fieldErrors.price}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6D4C41] mb-1">
              Estoque Inicial
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full rounded-xl border border-[#1B4332]/20 px-4 py-2 text-[#1B4332]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6D4C41] mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-[#1B4332]/20 px-4 py-2 text-[#1B4332] bg-white"
            >
              <option value="">Selecione</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6D4C41] mb-1">
              URL da Imagem
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-xl border border-[#1B4332]/20 px-4 py-2 text-[#1B4332]"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6D4C41] mb-1">
              Status Inicial
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
              className="w-full rounded-xl border border-[#1B4332]/20 px-4 py-2 text-[#1B4332] bg-white"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl border border-[#1B4332]/20 text-[#6D4C41] font-medium hover:bg-[#1B4332]/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1B4332] text-white py-2.5 rounded-xl font-medium hover:bg-[#2D5F4A] disabled:opacity-60 transition-colors"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Salvando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
