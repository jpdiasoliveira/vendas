import { useState, useEffect } from "react";
import { X, Loader2, Save, ImagePlus } from "lucide-react";
import { adminApiFetch, adminUploadImage } from "@/react-app/services/api";
import type { Product } from "@/react-app/types";

interface EditProductModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

export const EditProductModal = ({ isOpen, product, onClose, onSaved }: EditProductModalProps) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [priceWholesale, setPriceWholesale] = useState("");
  const [minQuantityWholesale, setMinQuantityWholesale] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [initialName, setInitialName] = useState("");
  const [initialPrice, setInitialPrice] = useState("");
  const [initialPriceWholesale, setInitialPriceWholesale] = useState("");
  const [initialMinQty, setInitialMinQty] = useState("");
  const [initialStock, setInitialStock] = useState("");
  const [initialDescription, setInitialDescription] = useState("");
  const [initialImageUrl, setInitialImageUrl] = useState("");

  useEffect(() => {
    if (!product) return;
    const p = String(product.price ?? "");
    const pw = product.priceWholesale != null ? String(product.priceWholesale) : "";
    const mq =
      product.minQuantityWholesale != null ? String(product.minQuantityWholesale) : "";
    const s = product.stock != null ? String(product.stock) : "0";
    const n = product.name ?? "";
    const desc = product.description ?? "";
    const img = product.imageUrl ?? "";
    setName(n);
    setPrice(p);
    setPriceWholesale(pw);
    setMinQuantityWholesale(mq);
    setStock(s);
    setDescription(desc);
    setImageUrl(img);
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setInitialName(n);
    setInitialPrice(p);
    setInitialPriceWholesale(pw);
    setInitialMinQty(mq);
    setInitialStock(s);
    setInitialDescription(desc);
    setInitialImageUrl(img);
    setError(null);
    setShowExitConfirm(false);
  }, [product]);

  const isDirty =
    name !== initialName ||
    price !== initialPrice ||
    priceWholesale !== initialPriceWholesale ||
    minQuantityWholesale !== initialMinQty ||
    stock !== initialStock ||
    description !== initialDescription ||
    imageUrl !== initialImageUrl ||
    imageFile !== null;

  const requestClose = () => {
    if (isDirty) setShowExitConfirm(true);
    else onClose();
  };

  const handleCloseWithoutSaving = () => {
    setShowExitConfirm(false);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImagePreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setImageFile(file ?? null);
  };

  const clearNewImageFile = () => {
    setImagePreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setImageFile(null);
  };

  const previewSrc =
    imageFile && imagePreview
      ? imagePreview
      : imageUrl.trim() || product?.imageUrl?.trim() || "";

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSaving(true);
    setError(null);
    try {
      const nameTrim = name.trim();
      if (!nameTrim) {
        setError("Nome do produto é obrigatório.");
        setSaving(false);
        return;
      }
      const p = Number.parseFloat(price);
      if (Number.isNaN(p) || p < 0) {
        setError("Preço varejo inválido.");
        setSaving(false);
        return;
      }
      const pw = priceWholesale === "" ? null : Number.parseFloat(priceWholesale);
      const mq = minQuantityWholesale === "" ? null : Number.parseInt(minQuantityWholesale, 10);
      const s = stock === "" ? null : Number.parseInt(stock, 10);

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

      const payload: Record<string, unknown> = {
        price: p,
        priceWholesale: priceWholesale === "" ? null : (Number.isNaN(pw as number) ? undefined : pw),
        minQuantityWholesale:
          minQuantityWholesale === "" ? null : (Number.isNaN(mq as number) ? undefined : mq),
        stock: stock === "" ? null : (Number.isNaN(s as number) ? undefined : s),
      };

      if (nameTrim !== initialName.trim()) {
        payload.title = nameTrim;
      }
      if (description !== initialDescription) {
        payload.description = description.trim();
      }
      const imageDirty = imageFile !== null || imageUrl.trim() !== initialImageUrl;
      if (imageDirty) {
        payload.image_url = imageUrlFinal || "";
      }

      await adminApiFetch(`/api/admin/products/${product.id}`, {
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

  const inputBase =
    "w-full rounded-xl border border-[#1B4332]/20 px-4 py-2 text-[#1B4332] bg-white transition-colors focus:border-[#1B4332]/50 focus:ring-2 focus:ring-[#1B4332]/15 focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#1B4332]/60 backdrop-blur-sm"
        onClick={requestClose}
        aria-hidden
      />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-white/50 w-full max-w-5xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-[#1B4332]/10">
          <h2 className="text-xl font-bold text-[#1B4332] font-playfair break-words pr-2 min-w-0 flex-1 leading-snug">
            Editar produto {name.trim() || product?.name || ""}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            className="p-2 text-[#6D4C41] hover:text-[#1B4332] hover:bg-[#1B4332]/5 rounded-xl transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 font-inter space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#6D4C41] mb-1">
              Nome do produto <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputBase}
              placeholder="Ex.: Chips de banana extra picante"
              autoComplete="off"
            />
          </div>

          {/* Mobile: imagem em cima, descrição embaixo. Desktop: duas colunas, labels alinhados, descrição estica com a coluna da imagem */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-stretch lg:gap-8">
            <div className="flex h-full min-h-0 min-w-0 flex-col gap-1">
              <label className="block shrink-0 text-sm font-medium leading-5 text-[#6D4C41] min-h-[2.5rem] lg:flex lg:items-end">
                Imagem do produto
              </label>
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <label className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-[#1B4332]/20 rounded-xl cursor-pointer hover:border-[#1B4332]/40 hover:bg-[#1B4332]/5 transition-colors shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                  <ImagePlus className="h-5 w-5 text-[#6D4C41]" />
                  <span className="text-sm text-[#6D4C41]">Escolher novo arquivo</span>
                </label>
                {imageFile && (
                  <button
                    type="button"
                    onClick={clearNewImageFile}
                    className="text-sm text-[#6D4C41] underline underline-offset-2 hover:text-[#1B4332] shrink-0"
                  >
                    Descartar arquivo selecionado
                  </button>
                )}
                {previewSrc ? (
                  <div className="relative shrink-0 rounded-xl overflow-hidden border border-[#1B4332]/15 bg-[#1B4332]/5">
                    <img src={previewSrc} alt="" className="w-full max-h-52 object-contain" />
                    <p className="text-xs text-[#6D4C41] p-2 bg-white/90 border-t border-[#1B4332]/10">
                      {imageFile
                        ? "Ao salvar, a imagem será enviada e a URL será atualizada no produto."
                        : "Imagem atual ou URL informada abaixo."}
                    </p>
                  </div>
                ) : null}
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className={`${inputBase} break-all shrink-0`}
                  placeholder="Ou cole a URL da imagem (https://...)"
                />
              </div>
            </div>

            <div className="flex h-full min-h-0 min-w-0 flex-col gap-1">
              <label className="block shrink-0 text-sm font-medium leading-5 text-[#6D4C41] min-h-[2.5rem] lg:flex lg:items-end">
                Descrição / informações ao consumidor
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className={`${inputBase} min-h-[160px] w-full flex-1 resize-y lg:min-h-[12rem]`}
                placeholder="Ingredientes, tabela nutricional, valores energéticos, alérgenos, etc."
              />
              <p className="shrink-0 text-xs text-[#6D4C41]/80">
                Esse texto pode aparecer na ficha do produto no site, conforme o layout da vitrine.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-[#6D4C41] mb-1">Preço (Varejo) R$</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputBase}
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
                className={inputBase}
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
                className={inputBase}
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
                className={inputBase}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={requestClose}
              className="flex-1 py-2.5 rounded-xl border border-[#1B4332]/20 text-[#6D4C41] font-medium hover:bg-[#1B4332]/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1B4332] text-white py-2.5 rounded-xl font-medium hover:bg-[#2D5F4A] disabled:opacity-60 transition-colors"
            >
              {saving || uploadingImage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {uploadingImage ? "Enviando imagem..." : saving ? "Salvando..." : "Salvar"}
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
};
