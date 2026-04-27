import { useState, useEffect } from "react";
import { X, Loader2, Save, ImagePlus } from "lucide-react";
import { adminApiFetch, adminUploadImage } from "@/react-app/services/api";
import type { Category } from "@/react-app/types";
import { useCurrencyMask } from "@/react-app/hooks/useCurrencyMask";
import { wholesaleCopy } from "@/react-app/utils/wholesaleCopy";

const UNITS = [
  { value: "Un", label: "Un" },
  { value: "Kg", label: "Kg" },
  { value: "Pacote", label: "Pacote" },
  { value: "Fardo", label: "Fardo" },
];

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddProductModal({ isOpen, onClose, onSaved }: AddProductModalProps) {
  const [name, setName] = useState("");
  const priceMask = useCurrencyMask();
  const [stock, setStock] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [wholesaleEnabled, setWholesaleEnabled] = useState(false);
  const wholesaleMask = useCurrencyMask();
  const [minWholesaleQty, setMinWholesaleQty] = useState("");
  const [unitType, setUnitType] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; price?: string }>({});
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const isDirty =
    name.trim() !== "" ||
    priceMask.parse() > 0 ||
    stock !== "0" ||
    categoryId.trim() !== "" ||
    imageUrl.trim() !== "" ||
    imageFile !== null ||
    wholesaleEnabled ||
    minWholesaleQty.trim() !== "" ||
    unitType.trim() !== "";

  const requestClose = () => {
    if (isDirty) setShowExitConfirm(true);
    else handleClose();
  };

  const handleCloseWithoutSaving = () => {
    setShowExitConfirm(false);
    handleClose();
  };

  const inputBase =
    "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 bg-white transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:outline-none";

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setCategoriesLoading(true);
    adminApiFetch<Category[]>("/api/admin/categories")
      .then((list) => {
        if (!cancelled) setCategoryOptions(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error("[AddProductModal.loadCategories]", err);
        if (!cancelled) setCategoryOptions([]);
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const wholesaleHints = wholesaleCopy(unitType);

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    priceMask.setValue(0);
    setStock("0");
    setCategoryId("");
    setImageUrl("");
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setStatus("active");
    setWholesaleEnabled(false);
    wholesaleMask.setValue(0);
    setMinWholesaleQty("");
    setUnitType("");
    setError(null);
    setFieldErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file ?? null);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const nameTrim = name.trim();
    const priceNum = priceMask.parse();

    const errors: { name?: string; price?: string } = {};
    if (!nameTrim) errors.name = "Nome do produto é obrigatório.";
    if (priceNum <= 0) errors.price = "Preço deve ser um número positivo.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      let imageUrlFinal = imageUrl.trim();
      if (imageFile) {
        setUploadingImage(true);
        try {
          const { publicUrl } = await adminUploadImage(imageFile);
          imageUrlFinal = publicUrl;
        } finally {
          setUploadingImage(false);
        }
      }

      const stockInt = Math.max(0, Math.floor(Number.parseFloat(stock.replace(",", ".")) || 0));
      const payload: Record<string, unknown> = {
        title: nameTrim,
        price: priceNum,
        stock: stockInt,
        ...(categoryId.trim() !== "" ? { category_id: categoryId.trim() } : {}),
        image_url: imageUrlFinal || "",
        status,
        unit_type: unitType.trim() || undefined,
      };
      if (wholesaleEnabled) {
        payload.priceWholesale = wholesaleMask.parse() || null;
        const mq = Math.floor(Number(minWholesaleQty) || 0);
        payload.minQuantityWholesale = mq > 0 ? mq : null;
      }

      await adminApiFetch("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(payload),
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
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={requestClose}
        aria-hidden
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Novo Produto</h2>
          <button
            type="button"
            onClick={requestClose}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 font-inter space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nome do Produto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputBase} ${fieldErrors.name ? "border-red-400 bg-red-50/50" : ""}`}
              placeholder="Ex: Chips de Banana"
              aria-invalid={!!fieldErrors.name}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Preço (BRL) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={priceMask.display}
              onChange={priceMask.handleChange}
              className={`${inputBase} ${fieldErrors.price ? "border-red-400 bg-red-50/50" : ""}`}
              aria-invalid={!!fieldErrors.price}
            />
            {fieldErrors.price && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.price}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Estoque Inicial
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={inputBase}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Unidade de Medida
              </label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value)}
                className={inputBase}
              >
                <option value="">Selecione</option>
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputBase}
              disabled={categoriesLoading}
            >
              <option value="">
                {categoriesLoading ? "Carregando…" : "Selecione (opcional)"}
              </option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {!categoriesLoading && categoryOptions.length === 0 && (
              <p className="mt-1.5 text-xs text-amber-700">
                Nenhuma categoria cadastrada para esta loja. Crie registros na tabela{" "}
                <code className="rounded bg-amber-100 px-1">categories</code> no Supabase (nome, slug,
                store_id) para aparecerem aqui.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Imagem do Produto</label>
            <div className="space-y-3">
              <label className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <ImagePlus className="h-5 w-5 text-slate-500" />
                <span className="text-sm text-slate-600">Escolher arquivo</span>
              </label>
              {imagePreview && (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-40 object-contain"
                  />
                  <p className="text-xs text-slate-500 p-2 bg-white border-t">
                    Pré-visualização. Ao salvar, a imagem será enviada e a URL será usada no produto.
                  </p>
                </div>
              )}
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={inputBase}
                placeholder="Ou cole a URL da imagem (https://...)"
              />
            </div>
          </div>

          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={wholesaleEnabled}
                onChange={(e) => setWholesaleEnabled(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-200"
              />
              <span className="text-sm font-medium text-slate-700">Ativar Atacado</span>
            </label>
            {wholesaleEnabled && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 items-end">
                  <div className="flex flex-col">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Preço atacado
                      <span className="mt-0.5 block font-normal text-xs leading-snug text-slate-500">
                        Por {wholesaleHints.pricePer} (mesma base do preço normal).
                      </span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={wholesaleMask.display}
                      onChange={wholesaleMask.handleChange}
                      className={inputBase}
                      aria-describedby="wholesale-qty-hint"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {wholesaleHints.minQtyLabel}
                      <span className="mt-0.5 block font-normal text-xs leading-snug text-slate-500">
                        Mesma unidade do produto.
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minWholesaleQty}
                      onChange={(e) => setMinWholesaleQty(e.target.value)}
                      className={inputBase}
                      placeholder="0"
                      aria-describedby="wholesale-qty-hint"
                    />
                  </div>
                </div>
                <p id="wholesale-qty-hint" className="text-xs text-slate-600 leading-relaxed">
                  {wholesaleHints.minQtyHint}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status Inicial</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
              className={inputBase}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={requestClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 disabled:opacity-60 transition-colors"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving
                ? uploadingImage
                  ? "Enviando imagem..."
                  : "Salvando..."
                : "Salvar"}
            </button>
          </div>
        </form>
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowExitConfirm(false)}
            aria-hidden
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-amber-200 max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Alterações não salvas</h3>
            <p className="text-sm text-slate-600 mb-6">
              Você fez edições neste produto. Deseja realmente sair sem salvar?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Continuar Editando
              </button>
              <button
                type="button"
                onClick={handleCloseWithoutSaving}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
              >
                Sair sem Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
