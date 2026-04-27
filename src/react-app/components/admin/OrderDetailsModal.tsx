import { X, Loader2, Send, MessageCircle, RefreshCw } from "lucide-react";
import { useOrderDetailsModal } from "@/react-app/hooks/useOrderDetailsModal";
import { StatusBadge } from "./StatusBadge";
import { formatCurrency, formatDate } from "@/react-app/utils/format";
import {
  STATUS_OPTIONS,
  buildWhatsAppUrl,
  orderNeedsCancellationMotive,
} from "./orderDetailsModalHelpers";

export interface OrderDetailsModalProps {
  isOpen: boolean;
  orderId: string | null;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export const OrderDetailsModal = ({
  isOpen,
  orderId,
  onClose,
  onStatusUpdated,
}: OrderDetailsModalProps) => {
  const {
    order,
    loading,
    updating,
    error,
    selectedStatus,
    setSelectedStatus,
    statusSuccessMessage,
    setStatusSuccessMessage,
    syncPaymentLoading,
    syncPaymentMessage,
    cancellationReason,
    setCancellationReason,
    handleSyncPayment,
    handleSubmitStatus,
  } = useOrderDetailsModal({ isOpen, orderId, onStatusUpdated });

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
                    <p className="font-medium text-[#1B4332] break-words">
                      {order.customerName?.trim() || "Cliente"}
                    </p>
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
                  {order.shippingPostalCode?.trim() ? (
                    <div>
                      <p className="text-[#6D4C41]">CEP (frete)</p>
                      <p className="font-medium text-[#1B4332]">{order.shippingPostalCode.trim()}</p>
                    </div>
                  ) : null}
                  {order.shippingFee != null && order.shippingFee > 0 ? (
                    <div>
                      <p className="text-[#6D4C41]">Frete</p>
                      <p className="font-medium text-[#1B4332]">{formatCurrency(order.shippingFee)}</p>
                    </div>
                  ) : null}
                  {order.couponCode?.trim() ? (
                    <div>
                      <p className="text-[#6D4C41]">Cupom</p>
                      <p className="font-medium text-[#1B4332]">
                        {order.couponCode.trim()}
                        {order.couponDiscount != null && order.couponDiscount > 0
                          ? ` (−${formatCurrency(order.couponDiscount)})`
                          : ""}
                      </p>
                    </div>
                  ) : null}
                  <div className="sm:col-span-2">
                    <p className="text-[#6D4C41]">Status</p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                      <StatusBadge status={order.paymentStatus ?? order.status ?? "pending"} />
                      {order.paymentId?.trim() ? (
                        <button
                          type="button"
                          onClick={handleSyncPayment}
                          disabled={syncPaymentLoading}
                          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-[#1B4332]/25 bg-[#FAF8F3] px-4 py-2.5 text-sm font-semibold text-[#1B4332] transition-colors hover:bg-[#1B4332]/10 disabled:opacity-60"
                        >
                          {syncPaymentLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                          ) : (
                            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                          )}
                          {syncPaymentLoading ? "Sincronizando…" : "Sincronizar pagamento"}
                        </button>
                      ) : (
                        <p className="text-sm text-[#6D4C41]">
                          Gere o PIX ou o checkout para aparecer o ID do pagamento; aí você poderá
                          sincronizar com o Mercado Pago.
                        </p>
                      )}
                    </div>
                    {syncPaymentMessage ? (
                      <div
                        className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                        role="status"
                      >
                        {syncPaymentMessage}
                      </div>
                    ) : null}
                  </div>
                  {order.deliveryAddress?.trim() ? (
                    <div className="sm:col-span-2">
                      <p className="text-[#6D4C41]">Endereço de entrega</p>
                      <p className="font-medium text-[#1B4332] whitespace-pre-wrap break-words">
                        {order.deliveryAddress.trim()}
                      </p>
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
                            <span className="font-medium text-[#1B4332] break-words">
                              {item.productName}
                            </span>
                            <span className="shrink-0 font-semibold text-[#1B4332]">
                              ×{item.quantity}
                            </span>
                          </div>
                          <div className="mt-2 flex justify-between gap-2 text-base text-[#5a4035]">
                            <span>{formatCurrency(item.price)} / un.</span>
                            <span className="font-semibold text-[#1B4332]">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
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
                            <tr
                              key={item.id ?? item.productId ?? idx}
                              className="border-t border-[#1B4332]/5"
                            >
                              <td className="px-3 py-2 text-[#5a4035]">{item.productName}</td>
                              <td className="px-3 py-2 text-right text-[#1B4332]">{item.quantity}</td>
                              <td className="px-3 py-2 text-right text-[#1B4332]">
                                {formatCurrency(item.price)}
                              </td>
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
                {statusSuccessMessage ? (
                  <div
                    className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-base text-emerald-900"
                    role="status"
                  >
                    {statusSuccessMessage}
                  </div>
                ) : null}
                {selectedStatus === "cancelled" && orderNeedsCancellationMotive(order) ? (
                  <div
                    className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                    role="alert"
                  >
                    <p className="font-semibold">Estorno manual pode ser necessário</p>
                    <p className="mt-1">
                      Este pedido já consta como pago ou em etapa avançada. Ao cancelar no sistema,
                      confira o Mercado Pago (ou outro gateway) e faça o estorno manual se o dinheiro
                      já tiver sido capturado.
                    </p>
                  </div>
                ) : null}
                {selectedStatus === "cancelled" ? (
                  <div className="mb-3 font-inter">
                    <label htmlFor="order-cancel-reason" className="mb-1 block text-sm font-medium text-[#6D4C41]">
                      Motivo do cancelamento
                      {orderNeedsCancellationMotive(order) ? (
                        <span className="text-red-500"> *</span>
                      ) : null}
                    </label>
                    <textarea
                      id="order-cancel-reason"
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      rows={3}
                      placeholder="Ex.: cliente desistiu; duplicidade; falha na entrega…"
                      className="w-full rounded-xl border border-[#1B4332]/20 bg-white px-4 py-3 text-base text-[#1B4332] placeholder:text-[#6D4C41]/60 focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                    />
                  </div>
                ) : null}
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setStatusSuccessMessage(null);
                    }}
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
};
