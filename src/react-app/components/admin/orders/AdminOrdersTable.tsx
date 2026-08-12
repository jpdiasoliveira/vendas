import type { Order, OrderDetail } from "@/react-app/types";
import { AdminOrderRow } from "@/react-app/components/admin/orders/AdminOrderRow";

type AdminOrdersTableProps = {
  displayedOrders: Order[];
  activeTab: "ativos" | "historico";
  expandedOrderId: string | null;
  expandedLoading: boolean;
  expandedError: boolean;
  expandedOrder: OrderDetail | null;
  shareCopiedOrderId: string | null;
  onOpenDetail: (id: string) => void;
  onExpand: (id: string) => void;
  onTracking: (id: string) => void;
  onCopyOrderShareLink: (order: Order) => void;
};

export function AdminOrdersTable({
  displayedOrders,
  activeTab,
  expandedOrderId,
  expandedLoading,
  expandedError,
  expandedOrder,
  shareCopiedOrderId,
  onOpenDetail,
  onExpand,
  onTracking,
  onCopyOrderShareLink,
}: AdminOrdersTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-brand-primary/10 bg-surface-elevated md:block">
      <div className="overflow-x-auto">
        <table className="w-full" role="table" aria-label={activeTab === "ativos" ? "Pedidos ativos" : "Histórico de pedidos"}>
          <thead>
            <tr className="border-b border-brand-primary/10 bg-surface-muted/60">
              <th className="px-4 py-4 text-left font-semibold text-content">Data</th>
              <th className="px-4 py-4 text-left font-semibold text-content">Cliente</th>
              <th className="px-4 py-4 text-left font-semibold text-content">Cidade/UF</th>
              <th className="px-4 py-4 text-left font-semibold text-content">Total</th>
              <th className="px-4 py-4 text-left font-semibold text-content">Rastreio</th>
              <th className="px-4 py-4 text-left font-semibold text-content">Status</th>
              <th className="w-0 px-4 py-4 text-left font-semibold text-content" />
            </tr>
          </thead>
          <tbody>
            {displayedOrders.map((order) => (
              <AdminOrderRow
                key={order.id}
                order={order}
                activeTab={activeTab}
                isExpanded={expandedOrderId === order.id}
                expandedLoading={expandedOrderId === order.id && expandedLoading}
                expandedError={expandedOrderId === order.id && expandedError}
                expandedOrder={expandedOrderId === order.id ? expandedOrder : null}
                shareCopiedOrderId={shareCopiedOrderId}
                onOpenDetail={onOpenDetail}
                onExpand={onExpand}
                onTracking={onTracking}
                onCopyOrderShareLink={onCopyOrderShareLink}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
