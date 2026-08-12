import type { Order, OrderDetail } from "@/react-app/types";
import { AdminOrderMobileCard } from "@/react-app/components/admin/orders/AdminOrderMobileCard";

type AdminOrdersMobileListProps = {
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

export function AdminOrdersMobileList(props: AdminOrdersMobileListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {props.displayedOrders.map((order) => (
        <AdminOrderMobileCard
          key={order.id}
          order={order}
          activeTab={props.activeTab}
          isExpanded={props.expandedOrderId === order.id}
          expandedLoading={props.expandedOrderId === order.id && props.expandedLoading}
          expandedError={props.expandedOrderId === order.id && props.expandedError}
          expandedOrder={props.expandedOrderId === order.id ? props.expandedOrder : null}
          shareCopiedOrderId={props.shareCopiedOrderId}
          onOpenDetail={props.onOpenDetail}
          onExpand={props.onExpand}
          onTracking={props.onTracking}
          onCopyOrderShareLink={props.onCopyOrderShareLink}
        />
      ))}
    </div>
  );
}
