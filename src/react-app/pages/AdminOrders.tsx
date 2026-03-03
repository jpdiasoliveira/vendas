import { useState, useEffect, useMemo, Fragment } from "react";
import { useNavigate } from "react-router";
import { RefreshCw, Home, LayoutDashboard, Package, ChevronDown, ChevronRight, Search, X, Eye, FileDown } from "lucide-react";
import { adminApiFetch } from "@/react-app/services/api";
import type { Order, OrderDetail } from "@/react-app/types";
import { AdminNav } from "@/react-app/components/admin/AdminNav";
import { StatusBadge } from "@/react-app/components/admin/StatusBadge";
import { OrderDetailsModal } from "@/react-app/components/admin/OrderDetailsModal";
import { InsertTrackingModal } from "@/react-app/components/admin/InsertTrackingModal";
import { HistoryOrderDetailModal } from "@/react-app/components/admin/HistoryOrderDetailModal";
import { exportClosingPdf } from "@/react-app/lib/exportClosingPdf";
import { formatCurrency, formatDate } from "@/react-app/utils/format";

const PAID_STATUSES = ["paid", "approved"];
const ACTIVE_STATUSES = ["pending", "paid", "shipped"];
const HISTORY_STATUSES = ["delivered", "cancelled"];

const getOrderStatus = (order: Order): string =>
  (order.paymentStatus ?? order.status ?? "pending").toLowerCase();

const isPaid = (order: Order) =>
  !!order.paymentStatus && PAID_STATUSES.includes(order.paymentStatus.toLowerCase());

const isAwaitingShipment = (order: Order) =>
  isPaid(order) && !order.trackingCode?.trim();

type HistoryPeriodFilter = "todos" | "hoje" | "ontem" | "7dias" | "este_mes";

function filterOrdersByPeriod(orders: Order[], period: HistoryPeriodFilter): Order[] {
  if (period === "todos") return orders;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneDayMs = 24 * 60 * 60 * 1000;

  return orders.filter((o) => {
    const createdAt = o.createdAt ? new Date(o.createdAt).getTime() : 0;
    switch (period) {
      case "hoje":
        return createdAt >= now.getTime() - oneDayMs;
      case "ontem": {
        const yesterdayStart = new Date(todayStart.getTime() - oneDayMs);
        const yesterdayEnd = todayStart.getTime();
        return createdAt >= yesterdayStart.getTime() && createdAt < yesterdayEnd;
      }
      case "7dias":
        return createdAt >= now.getTime() - 7 * oneDayMs;
      case "este_mes":
        return createdAt >= new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      default:
        return true;
    }
  });
}

const PERIOD_LABELS: Record<HistoryPeriodFilter, string> = {
  todos: "Todos",
  hoje: "Hoje",
  ontem: "Ontem",
  "7dias": "Últimos 7 Dias",
  este_mes: "Este Mês",
};

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
  const [activeTab, setActiveTab] = useState<"ativos" | "historico">("ativos");
  const [searchQuery, setSearchQuery] = useState("");
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState<HistoryPeriodFilter>("todos");
  const [historyDetailOrderId, setHistoryDetailOrderId] = useState<string | null>(null);

  const activeOrders = useMemo(
    () => orders.filter((o) => ACTIVE_STATUSES.includes(getOrderStatus(o))),
    [orders]
  );
  const historyOrders = useMemo(
    () => orders.filter((o) => HISTORY_STATUSES.includes(getOrderStatus(o))),
    [orders]
  );

  const historyOrdersByPeriod = useMemo(
    () => filterOrdersByPeriod(historyOrders, historyPeriodFilter),
    [historyOrders, historyPeriodFilter]
  );

  const ordersByTab = activeTab === "ativos" ? activeOrders : historyOrdersByPeriod;
  const displayedOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ordersByTab;
    return ordersByTab.filter((o) =>
      (o.customerName ?? "").toLowerCase().includes(q)
    );
  }, [ordersByTab, searchQuery]);

  const historyPeriodSummary = useMemo(() => {
    const total = displayedOrders.reduce((acc, o) => acc + (o.total ?? 0), 0);
    return { total, count: displayedOrders.length };
  }, [displayedOrders]);

  const awaitingShipmentCount = activeOrders.filter(isAwaitingShipment).length;

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
      setOrderDetailsCache((prev) => ({ ...prev, [orderId]: data }));
    } catch (err: unknown) {
      setItemsErrorOrderId(orderId);
      console.error("[AdminOrders.handleExpandOrder] Falha ao buscar itens do pedido:", orderId, err);
      alert("Erro ao buscar itens. Verifique a conexão e tente novamente.");
    } finally {
      setLoadingItemsOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
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

        {loading && orders.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 text-center shadow-sm border border-[#1B4332]/10">
            <RefreshCw className="h-12 w-12 text-[#1B4332] animate-spin mx-auto mb-4" />
            <p className="text-[#6D4C41] font-inter">Carregando pedidos...</p>
          </div>
        ) : (
          <>
            {orders.length > 0 && (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-4 font-inter">
                  <div
                    role="tablist"
                    aria-label="Abas de pedidos"
                    className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === "ativos"}
                      aria-controls="orders-tab-ativos"
                      id="tab-ativos"
                      onClick={() => setActiveTab("ativos")}
                      className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                        activeTab === "ativos"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      Ativos
                      <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold">
                        {activeOrders.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === "historico"}
                      aria-controls="orders-tab-historico"
                      id="tab-historico"
                      onClick={() => setActiveTab("historico")}
                      className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                        activeTab === "historico"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      Histórico
                      <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold">
                        {historyOrders.length}
                      </span>
                    </button>
                  </div>
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nome do cliente..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332] focus:outline-none"
                      aria-label="Buscar pedidos por nome do cliente"
                    />
                  </div>
                </div>

                {activeTab === "ativos" && awaitingShipmentCount > 0 && (
                  <div className="mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-inter flex items-center gap-3">
                    <span className="text-2xl" aria-hidden>📦</span>
                    <span className="font-semibold">
                      {awaitingShipmentCount} pedido(s) aguardando envio
                    </span>
                  </div>
                )}

                {activeTab === "historico" && (
                  <div className="mb-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-600 mr-1">Período:</span>
                      {(["hoje", "ontem", "7dias", "este_mes"] as const).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setHistoryPeriodFilter(key)}
                          className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                            historyPeriodFilter === key
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {PERIOD_LABELS[key]}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setHistoryPeriodFilter("todos")}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Limpar Filtros
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-inter text-sm">
                        <span className="font-semibold">Vendas no Período:</span>{" "}
                        {formatCurrency(historyPeriodSummary.total)} <span className="text-slate-500">|</span>{" "}
                        <span className="font-semibold">Pedidos:</span> {historyPeriodSummary.count}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          exportClosingPdf({
                            orders: displayedOrders,
                            periodLabel: PERIOD_LABELS[historyPeriodFilter],
                          })
                        }
                        className="inline-flex items-center gap-2 bg-[#EAD7BB] hover:bg-[#EAD7BB]/90 text-[#6D4C41] px-4 py-2.5 rounded-xl font-medium transition-colors border border-[#1B4332]/10 shadow-sm"
                        aria-label="Exportar relatório de fechamento em PDF"
                      >
                        <FileDown className="h-5 w-5" />
                        Exportar PDF
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {orders.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 text-center shadow-sm border border-[#1B4332]/10">
                <p className="text-[#6D4C41] font-inter">Nenhum pedido encontrado.</p>
              </div>
            ) : displayedOrders.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 text-center shadow-sm border border-[#1B4332]/10">
                <p className="text-[#6D4C41] font-inter">
                  {searchQuery.trim()
                    ? "Nenhum pedido encontrado com esse nome."
                    : activeTab === "ativos"
                      ? "Nenhum pedido ativo no momento."
                      : "Nenhum pedido no histórico."}
                </p>
              </div>
            ) : (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-[#1B4332]/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full font-inter" role="table" aria-label={activeTab === "ativos" ? "Pedidos ativos" : "Histórico de pedidos"}>
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
                    <tbody id={activeTab === "ativos" ? "orders-tab-ativos" : "orders-tab-historico"}>
                  {displayedOrders.map((order) => (
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
                            {activeTab === "historico" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHistoryDetailOrderId(order.id);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                title="Ver detalhes do pedido"
                                aria-label={`Ver detalhes do pedido ${order.id}`}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Ver detalhes
                              </button>
                            )}
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
          </>
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
        initialTrackingCode={orders.find((o) => o.id === trackingOrderId)?.trackingCode ?? undefined}
        initialShippingMethod={orders.find((o) => o.id === trackingOrderId)?.shippingMethod ?? undefined}
        onClose={() => setTrackingOrderId(null)}
        onSaved={fetchOrders}
      />

      <HistoryOrderDetailModal
        isOpen={historyDetailOrderId != null}
        orderId={historyDetailOrderId}
        onClose={() => setHistoryDetailOrderId(null)}
      />
    </div>
  );
}
