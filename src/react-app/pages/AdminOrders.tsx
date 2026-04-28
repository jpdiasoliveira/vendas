import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { RefreshCw, Home, LayoutDashboard, DollarSign, Flame, ScrollText } from "lucide-react";
import type { Order, Product } from "@/react-app/types";
import { buildOrderConfirmationShareUrl } from "@/react-app/utils/orderConfirmationUrl";
import { AdminNav } from "@/react-app/components/admin/AdminNav";
import { OrderDetailsModal } from "@/react-app/components/admin/OrderDetailsModal";
import { InsertTrackingModal } from "@/react-app/components/admin/InsertTrackingModal";
import { HistoryOrderDetailModal } from "@/react-app/components/admin/HistoryOrderDetailModal";
import { AdminOrdersToolbar } from "@/react-app/components/admin/AdminOrdersToolbar";
import { AdminOrdersMobileList } from "@/react-app/components/admin/AdminOrdersMobileList";
import { AdminOrdersDesktopTable } from "@/react-app/components/admin/AdminOrdersDesktopTable";
import { useAdminOrders } from "@/react-app/hooks/useAdminOrders";
import { adminApiFetch, apiFetch } from "@/react-app/services/api";
import type { AuditLogReport } from "@/shared/types";
import { formatCurrency } from "@/react-app/utils/format";

const SALES_STATUSES = new Set(["paid", "approved", "shipped", "delivered"]);

const AdminOrdersPage = () => {
  const navigate = useNavigate();
  const m = useAdminOrders();
  const [shareCopiedOrderId, setShareCopiedOrderId] = useState<string | null>(null);
  const [topSellerNames, setTopSellerNames] = useState<string[]>([]);
  const [latestLogs, setLatestLogs] = useState<AuditLogReport[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const totalSales = useMemo(
    () =>
      m.orders
        .filter((order) => SALES_STATUSES.has((order.status ?? "").toLowerCase()))
        .reduce((acc, order) => acc + Number(order.total || 0), 0),
    [m.orders]
  );

  const handleCopyOrderShareLink = useCallback(async (order: Order) => {
    const url = buildOrderConfirmationShareUrl(order);
    try {
      await navigator.clipboard.writeText(url);
      setShareCopiedOrderId(order.id);
      window.setTimeout(() => setShareCopiedOrderId(null), 2200);
    } catch (err) {
      console.error("[AdminOrdersPage.handleCopyOrderShareLink]", err);
    }
  }, []);

  const loadDashboardSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const [trendingIds, products, logs] = await Promise.all([
        apiFetch<string[]>("/api/products/trending"),
        adminApiFetch<Product[]>("/api/admin/products"),
        adminApiFetch<AuditLogReport[]>("/api/admin/audit-logs"),
      ]);
      const nameById = new Map((products ?? []).map((p) => [p.id, p.name]));
      const trendingNames = (trendingIds ?? [])
        .map((id) => nameById.get(id))
        .filter((n): n is string => typeof n === "string" && n.trim().length > 0)
        .slice(0, 3);
      setTopSellerNames(trendingNames);
      setLatestLogs(Array.isArray(logs) ? logs.slice(0, 5) : []);
    } catch (err) {
      console.error("[AdminOrdersPage.loadDashboardSummary]", err);
      setTopSellerNames([]);
      setLatestLogs([]);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardSummary();
  }, [loadDashboardSummary]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] px-4 pb-12 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--brand-primary)]/10 bg-white/60 text-[#6D4C41] shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-[var(--brand-primary)]"
              aria-label="Voltar"
            >
              <Home className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-8 w-8 text-[var(--brand-primary)]" />
              <div>
                <h1 className="font-playfair text-2xl font-bold text-[var(--brand-primary)]">Painel de Vendas</h1>
                <p className="font-inter text-sm text-[#6D4C41]">Acompanhe os pedidos da sua loja</p>
              </div>
            </div>
          </div>
          <div className="w-full min-w-0 sm:w-auto">
            <AdminNav>
              <button
                type="button"
                onClick={() => void m.fetchOrders()}
                disabled={m.loading}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[color:var(--brand-primary)]/20 bg-white/80 px-4 py-3 text-base font-medium text-[var(--brand-primary)] shadow-sm transition-all hover:bg-white disabled:opacity-60"
              >
                <RefreshCw className={`h-5 w-5 ${m.loading ? "animate-spin" : ""}`} />
                Atualizar
              </button>
            </AdminNav>
          </div>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[color:var(--brand-primary)]/15 bg-white/85 p-4 shadow-sm backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2 text-[var(--brand-primary)]">
              <DollarSign className="h-5 w-5" />
              <p className="text-sm font-semibold">Total de Vendas</p>
            </div>
            <p className="font-playfair text-2xl font-bold text-[var(--brand-primary)]">{formatCurrency(totalSales)}</p>
            <p className="mt-1 text-xs text-[#6D4C41]">Somatório de pedidos pagos/aprovados/enviados/entregues.</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--brand-primary)]/15 bg-white/85 p-4 shadow-sm backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2 text-[var(--brand-primary)]">
              <Flame className="h-5 w-5" />
              <p className="text-sm font-semibold">Produtos Mais Vendidos</p>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-[#6D4C41]">Carregando...</p>
            ) : topSellerNames.length === 0 ? (
              <p className="text-sm text-[#6D4C41]">Sem ranking recente.</p>
            ) : (
              <ul className="space-y-1 text-sm text-[#6D4C41]">
                {topSellerNames.map((name, idx) => (
                  <li key={`${name}-${idx}`} className="truncate">- {name}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-[color:var(--brand-primary)]/15 bg-white/85 p-4 shadow-sm backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2 text-[var(--brand-primary)]">
              <ScrollText className="h-5 w-5" />
              <p className="text-sm font-semibold">Últimos Logs</p>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-[#6D4C41]">Carregando...</p>
            ) : latestLogs.length === 0 ? (
              <p className="text-sm text-[#6D4C41]">Sem eventos recentes.</p>
            ) : (
              <ul className="space-y-1 text-xs text-[#6D4C41]">
                {latestLogs.map((log) => (
                  <li key={log.id} className="truncate" title={log.acao_descricao}>
                    - {log.acao_descricao}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {m.error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-inter text-red-700">{m.error}</div>
        )}

        {m.loading && m.orders.length === 0 ? (
          <div className="rounded-2xl border border-[color:var(--brand-primary)]/10 bg-white/70 p-12 text-center shadow-sm backdrop-blur-sm">
            <RefreshCw className="mx-auto mb-4 h-12 w-12 animate-spin text-[var(--brand-primary)]" />
            <p className="font-inter text-[#6D4C41]">Carregando pedidos...</p>
          </div>
        ) : (
          <>
            {m.orders.length > 0 && (
              <AdminOrdersToolbar
                activeTab={m.activeTab}
                setActiveTab={m.setActiveTab}
                activeOrders={m.activeOrders}
                historyOrders={m.historyOrders}
                searchQuery={m.searchQuery}
                setSearchQuery={m.setSearchQuery}
                historyPeriodFilter={m.historyPeriodFilter}
                setHistoryPeriodFilter={m.setHistoryPeriodFilter}
                displayedOrders={m.displayedOrders}
                historyPeriodSummary={m.historyPeriodSummary}
                awaitingShipmentCount={m.awaitingShipmentCount}
              />
            )}

            {m.orders.length === 0 ? (
              <div className="rounded-2xl border border-[color:var(--brand-primary)]/10 bg-white/70 p-12 text-center shadow-sm backdrop-blur-sm">
                <p className="font-inter text-[#6D4C41]">Nenhum pedido encontrado.</p>
              </div>
            ) : m.displayedOrders.length === 0 ? (
              <div className="rounded-2xl border border-[color:var(--brand-primary)]/10 bg-white/70 p-12 text-center shadow-sm backdrop-blur-sm">
                <p className="font-inter text-[#6D4C41]">
                  {m.searchQuery.trim()
                    ? "Nenhum pedido encontrado com esse nome."
                    : m.activeTab === "ativos"
                      ? "Nenhum pedido ativo no momento."
                      : "Nenhum pedido no histórico."}
                </p>
              </div>
            ) : (
              <>
                <AdminOrdersMobileList
                  displayedOrders={m.displayedOrders}
                  activeTab={m.activeTab}
                  expandedOrderId={m.expandedOrderId}
                  loadingItemsOrderId={m.loadingItemsOrderId}
                  itemsErrorOrderId={m.itemsErrorOrderId}
                  orderDetailsCache={m.orderDetailsCache}
                  shareCopiedOrderId={shareCopiedOrderId}
                  onOpenDetail={m.openDetail}
                  onExpand={m.handleExpandOrder}
                  onHistoryDetail={m.setHistoryDetailOrderId}
                  onTracking={m.setTrackingOrderId}
                  onCopyOrderShareLink={handleCopyOrderShareLink}
                />
                <AdminOrdersDesktopTable
                  displayedOrders={m.displayedOrders}
                  activeTab={m.activeTab}
                  expandedOrderId={m.expandedOrderId}
                  loadingItemsOrderId={m.loadingItemsOrderId}
                  itemsErrorOrderId={m.itemsErrorOrderId}
                  orderDetailsCache={m.orderDetailsCache}
                  shareCopiedOrderId={shareCopiedOrderId}
                  onOpenDetail={m.openDetail}
                  onExpand={m.handleExpandOrder}
                  onHistoryDetail={m.setHistoryDetailOrderId}
                  onTracking={m.setTrackingOrderId}
                  onCopyOrderShareLink={handleCopyOrderShareLink}
                />
              </>
            )}
          </>
        )}
      </div>

      <OrderDetailsModal
        isOpen={m.modalOpen}
        orderId={m.selectedOrderId}
        onClose={m.closeModal}
        onStatusUpdated={m.fetchOrders}
      />
      <InsertTrackingModal
        isOpen={m.trackingOrderId != null}
        orderId={m.trackingOrderId}
        initialTrackingCode={m.trackingOrder?.trackingCode ?? undefined}
        initialShippingMethod={m.trackingOrder?.shippingMethod ?? undefined}
        onClose={() => m.setTrackingOrderId(null)}
        onSaved={() => void m.fetchOrders()}
      />
      <HistoryOrderDetailModal
        isOpen={m.historyDetailOrderId != null}
        orderId={m.historyDetailOrderId}
        onClose={() => m.setHistoryDetailOrderId(null)}
      />
    </div>
  );
};

export default AdminOrdersPage;
