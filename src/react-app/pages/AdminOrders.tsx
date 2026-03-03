import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router";
import { RefreshCw, Home, LayoutDashboard, Package, ChevronDown, ChevronRight } from "lucide-react";
import { adminApiFetch } from "@/react-app/lib/api";
import type { Order, OrderDetail } from "@/react-app/types";
import { AdminNav } from "@/react-app/components/admin/AdminNav";
import { StatusBadge } from "@/react-app/components/admin/StatusBadge";
import { OrderDetailsModal } from "@/react-app/components/admin/OrderDetailsModal";
import { InsertTrackingModal } from "@/react-app/components/admin/InsertTrackingModal";

const PAID_STATUSES = ["paid", "approved"];

const isPaid = (order: Order) =>
  !!order.paymentStatus && PAID_STATUSES.includes(order.paymentStatus.toLowerCase());

const isAwaitingShipment = (order: Order) =>
  isPaid(order) && !order.trackingCode?.trim();

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

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderDetailsCache, setOrderDetailsCache] = useState<Record<string, OrderDetail>>({});
  const [loadingItemsOrderId, setLoadingItemsOrderId] = useState<string | null>(null);
  const [itemsErrorOrderId, setItemsErrorOrderId] = useState<string | null>(null);

  const awaitingShipmentCount = orders.filter(isAwaitingShipment).length;

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApiFetch<Order[]>("/api/admin/orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openDetail = (id: string) => {
    setSelectedOrderId(id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedOrderId(null);
  };

  const handleExpandOrder = async (orderId: string) => {
    console.log("--- CLIQUE DETECTADO ---", { orderId });
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setItemsErrorOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    setItemsErrorOrderId(null);
    if (orderDetailsCache[orderId]) return;
    setLoadingItemsOrderId(orderId);
    try {
      const data = await adminApiFetch<OrderDetail>(`/api/admin/orders/${orderId}`);
      console.log("Resposta da API: sucesso", data);
      setOrderDetailsCache((prev) => ({ ...prev, [orderId]: data }));
    } catch (err: unknown) {
      const status = err && typeof err === "object" && "status" in err ? (err as { status?: number }).status : undefined;
      console.log("Resposta da API:", status ?? "erro", err);
      setItemsErrorOrderId(orderId);
      alert("Erro ao buscar itens. Verifique a conexão e tente novamente.");
    } finally {
      setLoadingItemsOrderId(null);
    }
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
              <LayoutDashboard className="h-8 w-8 text-[#1B4332]" />
              <div>
                <h1 className="text-2xl font-bold text-[#1B4332] font-playfair">Painel de Vendas</h1>
                <p className="text-sm text-[#6D4C41] font-inter">Acompanhe os pedidos da sua loja</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AdminNav />
            <button
              onClick={fetchOrders}
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

        {orders.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-inter flex items-center gap-3">
            <span className="text-2xl" aria-hidden>📦</span>
            <span className="font-semibold">
              {awaitingShipmentCount} pedido(s) aguardando envio
            </span>
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 text-center shadow-xl border border-white/50">
            <RefreshCw className="h-12 w-12 text-[#1B4332] animate-spin mx-auto mb-4" />
            <p className="text-[#6D4C41] font-inter">Carregando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 text-center shadow-xl border border-white/50">
            <p className="text-[#6D4C41] font-inter">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full font-inter">
                <thead>
                  <tr className="bg-[#1B4332]/5 border-b border-[#1B4332]/10">
                    <th className="text-left py-4 px-4 text-[#1B4332] font-semibold">Data</th>
                    <th className="text-left py-4 px-4 text-[#1B4332] font-semibold">Cliente</th>
                    <th className="text-left py-4 px-4 text-[#1B4332] font-semibold">Cidade/UF</th>
                    <th className="text-left py-4 px-4 text-[#1B4332] font-semibold">Total</th>
                    <th className="text-left py-4 px-4 text-[#1B4332] font-semibold">Rastreio</th>
                    <th className="text-left py-4 px-4 text-[#1B4332] font-semibold">Status</th>
                    <th className="text-left py-4 px-4 text-[#1B4332] font-semibold w-0" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <Fragment key={order.id}>
                      <tr
                        onClick={() => openDetail(order.id)}
                        className="border-b border-[#1B4332]/5 hover:bg-[#FAF8F3]/50 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-4 text-[#6D4C41] whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-4 px-4 text-[#1B4332] font-medium">
                          {order.customerName?.trim() || "Cliente"}
                        </td>
                        <td className="py-4 px-4 text-[#6D4C41] text-sm">
                          {order.shippingCity && order.shippingState
                            ? `${order.shippingCity}/${order.shippingState}`
                            : "—"}
                        </td>
                        <td className="py-4 px-4 text-[#1B4332] font-bold">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="py-4 px-4 text-[#6D4C41] text-sm max-w-[140px] truncate" title={order.trackingCode ?? undefined}>
                          {order.trackingCode ?? "—"}
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={order.paymentStatus ?? order.status ?? "pending"} />
                        </td>
                        <td className="py-4 px-4 relative" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2 relative z-10">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExpandOrder(order.id);
                              }}
                              disabled={loadingItemsOrderId === order.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6D4C41]/10 text-[#6D4C41] hover:bg-[#6D4C41]/20 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {loadingItemsOrderId === order.id ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : expandedOrderId === order.id ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                              Ver Itens
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTrackingOrderId(order.id);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1B4332]/10 text-[#1B4332] hover:bg-[#1B4332]/20 transition-colors cursor-pointer"
                            >
                              <Package className="h-3.5 w-3.5" />
                              Inserir Rastreio
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedOrderId === order.id && (
                        <tr key={`${order.id}-items`} className="bg-slate-50 border-b border-slate-200">
                          <td colSpan={7} className="py-4 px-4">
                            {loadingItemsOrderId === order.id ? (
                              <div className="flex items-center gap-2 text-slate-600 text-sm">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Carregando itens…
                              </div>
                            ) : itemsErrorOrderId === order.id ? (
                              <p className="text-red-600 text-sm">Erro ao buscar itens. Tente novamente.</p>
                            ) : orderDetailsCache[order.id]?.items?.length ? (
                              <ul className="list-none space-y-2 text-sm">
                                {orderDetailsCache[order.id].items.map((item, idx) => (
                                  <li key={item.productId ?? idx} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/80 border border-slate-100">
                                    <span className="font-medium text-slate-800">{item.productName}</span>
                                    <span className="text-slate-600 font-semibold">Qtd: {item.quantity}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-slate-500 text-sm">Nenhum item.</span>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <OrderDetailsModal
        isOpen={modalOpen}
        orderId={selectedOrderId}
        onClose={closeModal}
        onStatusUpdated={fetchOrders}
      />
      <InsertTrackingModal
        isOpen={trackingOrderId != null}
        orderId={trackingOrderId}
        initialTrackingCode={orders.find((o) => o.id === trackingOrderId)?.trackingCode}
        initialShippingMethod={orders.find((o) => o.id === trackingOrderId)?.shippingMethod}
        onClose={() => setTrackingOrderId(null)}
        onSaved={fetchOrders}
      />
    </div>
  );
}
