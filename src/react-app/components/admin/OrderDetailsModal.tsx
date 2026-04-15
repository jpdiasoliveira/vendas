import { useState, useEffect } from "react";
import { X, Loader2, Send, MessageCircle } from "lucide-react";
import { adminApiFetch } from "@/react-app/services/api";
import type { OrderDetail } from "@/react-app/types";
import { StatusBadge } from "./StatusBadge";

import { formatCurrency, formatDate } from "@/react-app/utils/format";

/**
 * Valores de status enviados ao banco (sempre em inglês).
 * Nomes corretos: pending | paid | shipped | cancelled (cancelado = 'cancelled' com dois L).
 * Labels em PT só para exibição na UI.
 */
const STATUS_OPTIONS = [
  { value: "pending", label: "Pendente" },
  { value: "paid", label: "Pago" },
  { value: "shipped", label: "Enviado" },
  { value: "cancelled", label: "Cancelado" },
] as const;

/** Normaliza status vindo da API para um value do select (sempre inglês). */
function statusToSelectValue(apiStatus: string | null | undefined): string {
  const s = (apiStatus ?? "").trim().toLowerCase();
  if (s === "approved") return "paid";
  if (s === "canceled") return "cancelled";
  if (["pending", "paid", "shipped", "cancelled"].includes(s)) return s;
  return "pending";
}

/** Abre conversa no app WhatsApp Web/mobile (DDI 55 quando faltar). */
function buildWhatsAppUrl(raw: string | null | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  const digits = t.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const intl = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${intl}`;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  orderId: string | null;
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
        const normalized: OrderDetail = {
          ...data,
          items: Array.isArray(data.items) ? data.items : [],
        };
        setOrder(normalized);
        setSelectedStatus(statusToSelectValue(normalized.paymentStatus ?? normalized.status));
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
    <div className="fixed inset-0 z-50 flex items-stretch justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-[#1B4332]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex h-full max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-none border border-white/50 bg-white shadow-2xl sm:h-auto sm:max-h-[min(90dvh,800px)] sm:rounded-3xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#1B4332]/10 p-4 sm:p-6">
          <h2 className="min-w-0 text-lg font-bold text-[#1B4332] font-playfair sm:text-xl">
            Pedido {orderId != null ? `#${orderId}` : ""}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#6D4C41] transition-colors hover:bg-[#1B4332]/5 hover:text-[#1B4332]"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] font-inter sm:p-6">
          {loading && !order && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 text-[#1B4332] animate-spin mb-4" />
              <p className="text-base text-[#6D4C41]">Carregando...</p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-4 text-base text-red-700">{error}</div>
          )}

          {order && !loading && (() => {
            const list = Array.isArray(order.items) ? order.items : [];
            const waUrl = buildWhatsAppUrl(order.customerPhone);
            return (
              <>
                <div className="mb-6 grid grid-cols-1 gap-4 text-base sm:grid-cols-2">
                  <div>
                    <p className="text-[#6D4C41]">Data</p>
                    <p className="font-medium text-[#1B4332]">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-[#6D4C41]">Cliente</p>
                    <p className="font-medium text-[#1B4332] break-words">{order.customerName?.trim() || "Cliente"}</p>
                  </div>
                  {order.customerPhone?.trim() ? (
                    <div>
                      <p className="text-[#6D4C41]">Telefone</p>
                      <p className="font-medium text-[#1B4332]">{order.customerPhone.trim()}</p>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-[#6D4C41]">Total</p>
                    <p className="font-bold text-[#1B4332]">{formatCurrency(order.total)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[#6D4C41]">Status</p>
                    <StatusBadge status={order.paymentStatus ?? order.status ?? "pending"} />
                  </div>
                  {order.deliveryAddress?.trim() ? (
                    <div className="sm:col-span-2">
                      <p className="text-[#6D4C41]">Endereço de entrega</p>
                      <p className="font-medium text-[#1B4332] whitespace-pre-wrap break-words">{order.deliveryAddress.trim()}</p>
                    </div>
                  ) : null}
                </div>

                {waUrl ? (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#25D366]/15 px-4 py-3 text-base font-semibold text-[#1B4332] ring-1 ring-[#25D366]/40 transition-colors hover:bg-[#25D366]/25"
                  >
                    <MessageCircle className="h-5 w-5 shrink-0 text-[#128C7E]" aria-hidden />
                    Zap rápido (WhatsApp)
                  </a>
                ) : null}

                <h3 className="mb-3 font-semibold text-[#1B4332]">Itens</h3>
                {list.length === 0 ? (
                  <p className="mb-6 rounded-xl border border-[#1B4332]/10 bg-[#FAF8F3]/40 px-3 py-4 text-base text-[#6D4C41]">
                    Nenhum item encontrado para este pedido.
                  </p>
                ) : (
                  <>
                    <ul className="mb-6 space-y-2 md:hidden">
                      {list.map((item, idx) => (
                        <li
                          key={item.id ?? item.productId ?? idx}
                          className="rounded-xl border border-[#1B4332]/10 bg-[#FAF8F3]/50 px-3 py-3"
                        >
                          <div className="flex justify-between gap-2">
                            <span className="font-medium text-[#1B4332] break-words">{item.productName}</span>
                            <span className="shrink-0 font-semibold text-[#1B4332]">×{item.quantity}</span>
                          </div>
                          <div className="mt-2 flex justify-between gap-2 text-base text-[#5a4035]">
                            <span>{formatCurrency(item.price)} / un.</span>
                            <span className="font-semibold text-[#1B4332]">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mb-6 hidden overflow-x-auto rounded-xl border border-[#1B4332]/10 md:block">
                      <table className="w-full text-base">
                        <thead>
                          <tr className="bg-[#1B4332]/5">
                            <th className="px-3 py-2 text-left text-[#1B4332]">Produto</th>
                            <th className="px-3 py-2 text-right text-[#1B4332]">Qtd</th>
                            <th className="px-3 py-2 text-right text-[#1B4332]">Preço</th>
                            <th className="px-3 py-2 text-right text-[#1B4332]">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((item, idx) => (
                            <tr key={item.id ?? item.productId ?? idx} className="border-t border-[#1B4332]/5">
                              <td className="px-3 py-2 text-[#5a4035]">{item.productName}</td>
                              <td className="px-3 py-2 text-right text-[#1B4332]">{item.quantity}</td>
                              <td className="px-3 py-2 text-right text-[#1B4332]">{formatCurrency(item.price)}</td>
                              <td className="px-3 py-2 text-right font-medium text-[#1B4332]">
                                {formatCurrency(item.price * item.quantity)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <h3 className="mb-3 font-semibold text-[#1B4332]">Alterar status</h3>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="min-h-[48px] w-full rounded-xl border border-[#1B4332]/20 bg-white px-4 py-3 text-base text-[#1B4332] sm:min-w-[180px] sm:w-auto"
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
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-5 py-3 text-base font-medium text-white transition-colors hover:bg-[#2D5F4A] disabled:opacity-60 sm:w-auto"
                  >
                    {updating ? (
                      <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                    ) : (
                      <Send className="h-5 w-5 shrink-0" />
                    )}
                    {updating ? "Salvando..." : "Atualizar status"}
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
