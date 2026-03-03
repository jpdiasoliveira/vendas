import { useState, useEffect, useRef } from "react";
import { X, Loader2, Printer } from "lucide-react";
import { adminApiFetch } from "@/react-app/services/api";
import type { OrderDetail } from "@/react-app/types";

import { formatCurrency, formatDate } from "@/react-app/utils/format";

interface HistoryOrderDetailModalProps {
  isOpen: boolean;
  orderId: string | null;
  onClose: () => void;
}

export function HistoryOrderDetailModal({
  isOpen,
  orderId,
  onClose,
}: HistoryOrderDetailModalProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

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
        setOrder({
          ...data,
          items: Array.isArray(data.items) ? data.items : [],
        });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Erro ao carregar pedido");
      })
      .finally(() => setLoading(false));
  }, [isOpen, orderId]);

  const handlePrint = () => {
    if (!order || !printRef.current) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const itemsRows = (order.items ?? [])
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.productName)}</td><td class="text-right">${item.quantity}</td><td class="text-right">${formatCurrency(item.price)}</td><td class="text-right">${formatCurrency(item.price * item.quantity)}</td></tr>`
      )
      .join("");
    const status = (order.paymentStatus ?? order.status ?? "").toLowerCase();
    const address = [order.shippingCity, order.shippingState].filter(Boolean).join(" / ") || "—";
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Recibo - Pedido ${escapeHtml(orderId ?? "")}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 1rem; max-width: 480px; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
            th, td { padding: 0.35rem 0.5rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
            .text-right { text-align: right; }
            .mb { margin-bottom: 0.75rem; }
            .bold { font-weight: 600; }
          </style>
        </head>
        <body>
          <h1 style="margin-top:0;">Recibo do Pedido</h1>
          <p class="mb"><strong>Data:</strong> ${formatDate(order.createdAt)}</p>
          <p class="mb"><strong>Cliente:</strong> ${escapeHtml(order.customerName?.trim() || "—")}</p>
          <p class="mb"><strong>Telefone:</strong> ${escapeHtml(order.customerPhone?.trim() || "—")}</p>
          <p class="mb"><strong>Endereço de entrega:</strong> ${escapeHtml(address)}</p>
          <table>
            <thead><tr><th>Produto</th><th class="text-right">Qtd</th><th class="text-right">Preço</th><th class="text-right">Subtotal</th></tr></thead>
            <tbody>${itemsRows}</tbody>
          </table>
          <p class="bold">Total: ${formatCurrency(order.total)}</p>
          <p class="mb"><strong>Status:</strong> ${status}</p>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  if (!isOpen) return null;

  const status = order ? (order.paymentStatus ?? order.status ?? "pending").toLowerCase() : "";
  const isCancelled = status === "cancelled";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Detalhes do Pedido (Histórico)</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={printRef} className="flex-1 overflow-y-auto p-6 font-inter space-y-6">
          {loading && !order && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 text-slate-500 animate-spin mb-4" />
              <p className="text-slate-600">Carregando...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          {order && !loading && (
            <>
              <section>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Dados do Cliente
                </h3>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm">
                  <p><span className="font-medium text-slate-700">Nome:</span> {order.customerName?.trim() || "—"}</p>
                  <p><span className="font-medium text-slate-700">Telefone:</span> {order.customerPhone?.trim() || "—"}</p>
                  <p>
                    <span className="font-medium text-slate-700">Endereço de entrega:</span>{" "}
                    {[order.shippingCity, order.shippingState].filter(Boolean).join(" / ") || "—"}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Lista de Produtos
                </h3>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left py-2.5 px-3 text-slate-700 font-semibold">Nome</th>
                        <th className="text-right py-2.5 px-3 text-slate-700 font-semibold">Qtd</th>
                        <th className="text-right py-2.5 px-3 text-slate-700 font-semibold">Preço</th>
                        <th className="text-right py-2.5 px-3 text-slate-700 font-semibold">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order.items ?? []).map((item, idx) => (
                        <tr key={item.id ?? item.productId ?? idx} className="border-b border-slate-100 last:border-0">
                          <td className="py-2.5 px-3 text-slate-800">{item.productName}</td>
                          <td className="py-2.5 px-3 text-right text-slate-700">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-slate-700">{formatCurrency(item.price)}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                            {formatCurrency(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-right font-bold text-slate-800">Total: {formatCurrency(order.total)}</p>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Linha do Tempo
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" aria-hidden />
                    Criado em {formatDate(order.createdAt)}
                  </li>
                  {["paid", "shipped", "delivered", "cancelled"].includes(status) && (
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden />
                      Pago
                    </li>
                  )}
                  {["shipped", "delivered", "cancelled"].includes(status) && status !== "cancelled" && (
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-500" aria-hidden />
                      Enviado
                    </li>
                  )}
                  {status === "delivered" && (
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
                      Entregue
                    </li>
                  )}
                  {status === "cancelled" && (
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden />
                      Cancelado
                    </li>
                  )}
                </ul>
              </section>

              {isCancelled && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
                  <p className="font-semibold">Motivo do cancelamento</p>
                  <p>Pedido cancelado. Motivo não registrado no sistema.</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir Recibo
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
