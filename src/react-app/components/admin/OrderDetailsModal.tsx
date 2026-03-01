import { useState, useEffect } from "react";
import { X, Loader2, Send } from "lucide-react";
import { adminApiFetch } from "@/react-app/lib/api";
import type { OrderDetail } from "@/react-app/types";
import { StatusBadge } from "./StatusBadge";

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendente" },
  { value: "approved", label: "Aprovado" },
  { value: "shipped", label: "Enviado" },
  { value: "cancelled", label: "Cancelado" },
] as const;

interface OrderDetailsModalProps {
  isOpen: boolean;
  orderId: number | null;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export function OrderDetailsModal({
  isOpen,
  orderId,
  onClose,
  onStatusUpdated,
}: OrderDetailsModalProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  useEffect(() => {
    if (!isOpen || !orderId) {
      setOrder(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    adminApiFetch<OrderDetail>(`/api/admin/orders/${orderId}`)
      .then((data) => {
        setOrder(data);
        setSelectedStatus(data.paymentStatus ?? data.status ?? "pending");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Erro ao carregar pedido");
      })
      .finally(() => setLoading(false));
  }, [isOpen, orderId]);

  const handleSubmitStatus = async () => {
    if (!orderId || !selectedStatus) return;
    setUpdating(true);
    setError(null);
    try {
      await adminApiFetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: selectedStatus }),
      });
      setOrder((prev) => (prev ? { ...prev, paymentStatus: selectedStatus } : null));
      onStatusUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar status");
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#1B4332]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-white/50 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#1B4332]/10">
          <h2 className="text-xl font-bold text-[#1B4332] font-playfair">
            Detalhes do Pedido {orderId != null ? `#${orderId}` : ""}
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

        <div className="flex-1 overflow-y-auto p-6 font-inter">
          {loading && !order && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 text-[#1B4332] animate-spin mb-4" />
              <p className="text-[#6D4C41]">Carregando...</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
          )}

          {order && !loading && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-[#6D4C41]">Data</p>
                  <p className="font-medium text-[#1B4332]">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[#6D4C41]">Cliente</p>
                  <p className="font-medium text-[#1B4332]">{order.customerName ?? "Cliente"}</p>
                </div>
                <div>
                  <p className="text-[#6D4C41]">Total</p>
                  <p className="font-bold text-[#1B4332]">{formatCurrency(order.total)}</p>
                </div>
                <div>
                  <p className="text-[#6D4C41]">Status</p>
                  <StatusBadge status={order.paymentStatus ?? order.status ?? "pending"} />
                </div>
              </div>

              <h3 className="font-semibold text-[#1B4332] mb-3">Itens</h3>
              <div className="overflow-x-auto rounded-xl border border-[#1B4332]/10 mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1B4332]/5">
                      <th className="text-left py-2 px-3 text-[#1B4332]">Produto</th>
                      <th className="text-right py-2 px-3 text-[#1B4332]">Qtd</th>
                      <th className="text-right py-2 px-3 text-[#1B4332]">Preço</th>
                      <th className="text-right py-2 px-3 text-[#1B4332]">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id ?? item.productId} className="border-t border-[#1B4332]/5">
                        <td className="py-2 px-3 text-[#6D4C41]">{item.productName}</td>
                        <td className="py-2 px-3 text-right text-[#1B4332]">{item.quantity}</td>
                        <td className="py-2 px-3 text-right text-[#1B4332]">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-[#1B4332]">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="font-semibold text-[#1B4332] mb-2">Alterar status</h3>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-xl border border-[#1B4332]/20 px-4 py-2 text-[#1B4332] bg-white min-w-[140px]"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleSubmitStatus}
                  disabled={updating}
                  className="inline-flex items-center gap-2 bg-[#1B4332] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#2D5F4A] disabled:opacity-60 transition-colors"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {updating ? "Salvando..." : "Atualizar status"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
