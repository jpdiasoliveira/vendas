import { useCallback, useMemo, useState } from "react";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import type { Order } from "@/react-app/types";
import { useToast } from "@/react-app/providers/ToastProvider";
import { buildOrderConfirmationShareUrl } from "@/react-app/utils/orderConfirmationUrl";
import { useAdminOrders } from "@/react-app/hooks/admin/useAdminOrders";
import { useAdminOrdersDashboard } from "@/react-app/hooks/admin/useAdminOrdersDashboard";
import { AdminOrdersDashboard } from "@/react-app/components/admin/orders/AdminOrdersDashboard";
import { AdminOrdersFilters } from "@/react-app/components/admin/orders/AdminOrdersFilters";
import { AdminOrdersTable } from "@/react-app/components/admin/orders/AdminOrdersTable";
import { AdminOrdersMobileList } from "@/react-app/components/admin/orders/AdminOrdersMobileList";
import { AdminOrderDetailsDrawer } from "@/react-app/components/admin/orders/AdminOrderDetailsDrawer";
import { AdminTrackingDrawer } from "@/react-app/components/admin/orders/AdminTrackingDrawer";

const SALES_STATUSES = new Set(["paid", "approved", "shipped", "delivered"]);

const AdminOrdersPage = () => {
  const { showToast } = useToast();
  const orders = useAdminOrders();
  const dashboard = useAdminOrdersDashboard();
  const [shareCopiedOrderId, setShareCopiedOrderId] = useState<string | null>(null);

  const totalSales = useMemo(
    () =>
      orders.orders
        .filter((order) => SALES_STATUSES.has((order.status ?? "").toLowerCase()))
        .reduce((acc, order) => acc + Number(order.total || 0), 0),
    [orders.orders],
  );

  const handleCopyOrderShareLink = useCallback(async (order: Order) => {
    try {
      await navigator.clipboard.writeText(buildOrderConfirmationShareUrl(order));
      setShareCopiedOrderId(order.id);
      window.setTimeout(() => setShareCopiedOrderId(null), 2200);
    } catch {
      showToast({ type: "error", message: "Não foi possível copiar o link de compartilhamento do pedido." });
    }
  }, [showToast]);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-9 w-9 shrink-0 text-brand-primary sm:h-10 sm:w-10" />
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-content sm:text-4xl">
              Painel de Vendas
            </h1>
            <p className="mt-0.5 text-sm text-content-muted">Acompanhe os pedidos da sua loja</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void orders.refetchOrders()}
          disabled={orders.loading}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-brand-primary/20 bg-surface-elevated px-3 py-2.5 text-sm font-medium text-content-muted transition hover:bg-surface-muted hover:text-content disabled:opacity-60"
        >
          <RefreshCw className={`h-5 w-5 ${orders.loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      <AdminOrdersDashboard
        totalSales={totalSales}
        topSellerNames={dashboard.data?.topSellerNames ?? []}
        latestLogs={dashboard.data?.latestLogs ?? []}
        loading={dashboard.isPending}
      />

      {orders.error ? (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">{orders.error}</div>
      ) : null}

      {orders.loading && orders.orders.length === 0 ? (
        <div className="rounded-2xl border border-brand-primary/10 bg-surface-elevated p-12 text-center">
          <RefreshCw className="mx-auto mb-4 h-12 w-12 animate-spin text-brand-primary" />
          <p className="text-content-muted">Carregando pedidos...</p>
        </div>
      ) : orders.orders.length === 0 ? (
        <div className="rounded-2xl border border-brand-primary/10 bg-surface-elevated p-12 text-center">
          <p className="text-content-muted">Nenhum pedido encontrado.</p>
        </div>
      ) : (
        <>
          <AdminOrdersFilters
            activeTab={orders.activeTab}
            setActiveTab={orders.setActiveTab}
            activeOrders={orders.activeOrders}
            historyOrders={orders.historyOrders}
            searchQuery={orders.searchQuery}
            setSearchQuery={orders.setSearchQuery}
            historyPeriodFilter={orders.historyPeriodFilter}
            setHistoryPeriodFilter={orders.setHistoryPeriodFilter}
            displayedOrders={orders.displayedOrders}
            historyPeriodSummary={orders.historyPeriodSummary}
            awaitingShipmentCount={orders.awaitingShipmentCount}
          />
          {orders.displayedOrders.length === 0 ? (
            <div className="rounded-2xl border border-brand-primary/10 bg-surface-elevated p-12 text-center">
              <p className="text-content-muted">
                {orders.searchQuery.trim()
                  ? "Nenhum pedido encontrado com esse nome."
                  : orders.activeTab === "ativos"
                    ? "Nenhum pedido ativo no momento."
                    : "Nenhum pedido no histórico."}
              </p>
            </div>
          ) : (
            <>
              <AdminOrdersMobileList
                displayedOrders={orders.displayedOrders}
                activeTab={orders.activeTab}
                expandedOrderId={orders.expandedOrderId}
                expandedLoading={orders.expandedLoading}
                expandedError={orders.expandedError}
                expandedOrder={orders.expandedOrder}
                shareCopiedOrderId={shareCopiedOrderId}
                onOpenDetail={orders.openDetail}
                onExpand={orders.handleExpandOrder}
                onTracking={orders.setTrackingOrderId}
                onCopyOrderShareLink={handleCopyOrderShareLink}
              />
              <AdminOrdersTable
                displayedOrders={orders.displayedOrders}
                activeTab={orders.activeTab}
                expandedOrderId={orders.expandedOrderId}
                expandedLoading={orders.expandedLoading}
                expandedError={orders.expandedError}
                expandedOrder={orders.expandedOrder}
                shareCopiedOrderId={shareCopiedOrderId}
                onOpenDetail={orders.openDetail}
                onExpand={orders.handleExpandOrder}
                onTracking={orders.setTrackingOrderId}
                onCopyOrderShareLink={handleCopyOrderShareLink}
              />
            </>
          )}
        </>
      )}

      <AdminOrderDetailsDrawer
        isOpen={orders.drawerOpen}
        orderId={orders.selectedOrderId}
        order={orders.drawerOrder}
        loading={orders.drawerLoading}
        error={orders.drawerError}
        onClose={orders.closeDrawer}
      />
      <AdminTrackingDrawer
        isOpen={orders.trackingOrderId != null}
        orderId={orders.trackingOrderId}
        initialTrackingCode={orders.trackingOrder?.trackingCode}
        initialShippingMethod={orders.trackingOrder?.shippingMethod}
        onClose={() => orders.setTrackingOrderId(null)}
        onSaved={() => void orders.refetchOrders()}
      />
    </>
  );
};

export default AdminOrdersPage;
