import { useState, useEffect } from "react";
import { X, Package } from "lucide-react";
import { adminApiFetch } from "@/react-app/services/api";

interface InsertTrackingModalProps {
  isOpen: boolean;
  orderId: string | null;
  initialTrackingCode?: string | null;
  initialShippingMethod?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export const InsertTrackingModal = ({
  isOpen,
  orderId,
  initialTrackingCode,
  initialShippingMethod,
  onClose,
  onSaved,
}: InsertTrackingModalProps) => {
  const [trackingCode, setTrackingCode] = useState("");
  const [shippingMethod, setShippingMethod] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTrackingCode(initialTrackingCode ?? "");
      setShippingMethod(initialShippingMethod ?? "");
      setError(null);
    }
  }, [isOpen, orderId, initialTrackingCode, initialShippingMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId == null || orderId === "") return;
    setSaving(true);
    setError(null);
    try {
      await adminApiFetch(`/api/admin/orders/${orderId}/tracking`, {
        method: "PATCH",
        body: JSON.stringify({
          trackingCode: trackingCode.trim() || null,
          shippingMethod: shippingMethod.trim() || null,
        }),
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar rastreio");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#1B4332]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/50 font-inter"
        role="dialog"
        aria-modal="true"
        aria-labelledby="insert-tracking-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6D4C41] hover:text-[#1B4332] transition-colors"
          aria-label="Fechar"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-full bg-[#1B4332]/10 p-3">
            <Package className="h-6 w-6 text-[#1B4332]" />
          </div>
          <h2 id="insert-tracking-title" className="text-xl font-bold text-[#1B4332]">
            Inserir Rastreio
          </h2>
        </div>
        <p className="text-[#6D4C41] text-sm mb-4">
          Preencha o código de rastreio e a transportadora para o pedido #{orderId}.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tracking-code" className="block text-sm font-medium text-[#1B4332] mb-1">
              Código de rastreio
            </label>
            <input
              id="tracking-code"
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Ex: BR123456789BR"
              className="w-full px-4 py-2.5 rounded-xl border border-[#1B4332]/20 text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
            />
          </div>
          <div>
            <label htmlFor="shipping-method" className="block text-sm font-medium text-[#1B4332] mb-1">
              Transportadora / Método de envio
            </label>
            <input
              id="shipping-method"
              type="text"
              value={shippingMethod}
              onChange={(e) => setShippingMethod(e.target.value)}
              placeholder="Ex: Correios SEDEX, Jadlog"
              className="w-full px-4 py-2.5 rounded-xl border border-[#1B4332]/20 text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#6D4C41] bg-white border border-[#1B4332]/20 hover:bg-[#FAF8F3] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-[#1B4332] hover:bg-[#2D5F4A] transition-colors disabled:opacity-60"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
