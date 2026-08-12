import { ChevronDown, ChevronRight, Eye, Link2, Package, RefreshCw } from "lucide-react";
import type { Order, OrderDetail } from "@/react-app/types";
import { StatusBadge } from "@/react-app/components/admin/StatusBadge";
import { formatCurrency, formatDate } from "@/react-app/utils/format";

type AdminOrderRowProps = {
  order: Order;
  activeTab: "ativos" | "historico";
  isExpanded: boolean;
  expandedLoading: boolean;
  expandedError: boolean;
  expandedOrder: OrderDetail | null;
  shareCopiedOrderId: string | null;
  onOpenDetail: (id: string) => void;
  onExpand: (id: string) => void;
  onTracking: (id: string) => void;
  onCopyOrderShareLink: (order: Order) => void;
};

export function AdminOrderRow({
  order,
  activeTab,
  isExpanded,
  expandedLoading,
  expandedError,
  expandedOrder,
  shareCopiedOrderId,
  onOpenDetail,
  onExpand,
  onTracking,
  onCopyOrderShareLink,
}: AdminOrderRowProps) {
  const actionBtn =
    "inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

  return (
    <>
      <tr
        onClick={() => onOpenDetail(order.id)}
        className="cursor-pointer border-b border-brand-primary/5 transition-colors hover:bg-surface-muted/60"
      >
        <td className="whitespace-nowrap px-4 py-4 text-content-muted">{formatDate(order.createdAt)}</td>
        <td className="px-4 py-4 font-medium text-content">{order.customerName?.trim() || "Cliente"}</td>
        <td className="px-4 py-4 text-sm text-content-muted">
          {order.shippingCity && order.shippingState ? `${order.shippingCity}/${order.shippingState}` : "—"}
        </td>
        <td className="px-4 py-4 font-bold text-content">{formatCurrency(order.total)}</td>
        <td className="max-w-[140px] truncate px-4 py-4 text-sm text-content-muted" title={order.trackingCode ?? undefined}>
          {order.trackingCode ?? "—"}
        </td>
        <td className="px-4 py-4">
          <StatusBadge status={order.paymentStatus ?? order.status ?? "pending"} />
        </td>
        <td className="relative px-4 py-4" onClick={(e) => e.stopPropagation()}>
          <div className="relative z-10 flex flex-wrap items-center gap-2">
            {activeTab === "historico" ? (
              <button
                type="button"
                onClick={() => onOpenDetail(order.id)}
                className={`${actionBtn} bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15`}
              >
                <Eye className="h-3.5 w-3.5" />
                Ver detalhes
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onExpand(order.id)}
              disabled={expandedLoading && isExpanded}
              className={`${actionBtn} bg-surface-muted text-content-muted hover:bg-surface-elevated disabled:opacity-60`}
            >
              {expandedLoading && isExpanded ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Ver itens
            </button>
            <button
              type="button"
              onClick={() => onTracking(order.id)}
              className={`${actionBtn} bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15`}
            >
              <Package className="h-3.5 w-3.5" />
              Rastreio
            </button>
            <button
              type="button"
              onClick={() => onCopyOrderShareLink(order)}
              className={`${actionBtn} bg-emerald-950/30 text-emerald-200 ring-1 ring-emerald-500/30 hover:bg-emerald-950/40`}
            >
              <Link2 className="h-3.5 w-3.5 shrink-0" />
              {shareCopiedOrderId === order.id ? "Copiado!" : "Copiar link"}
            </button>
          </div>
        </td>
      </tr>
      {isExpanded ? (
        <tr className="border-b border-brand-primary/10 bg-surface-muted/40">
          <td colSpan={7} className="px-4 py-4">
            {expandedLoading ? (
              <div className="flex items-center gap-2 text-sm text-content-muted">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Carregando itens…
              </div>
            ) : expandedError ? (
              <p className="text-sm text-red-300">Erro ao buscar itens. Tente novamente.</p>
            ) : expandedOrder?.items?.length ? (
              <ul className="list-none space-y-2 text-sm">
                {expandedOrder.items.map((item, idx) => (
                  <li
                    key={item.productId ?? idx}
                    className="flex items-center justify-between rounded-lg border border-brand-primary/10 bg-surface-elevated px-3 py-1.5"
                  >
                    <span className="font-medium text-content">{item.productName}</span>
                    <span className="font-semibold text-content-muted">Qtd: {item.quantity}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-sm text-content-muted">Nenhum item.</span>
            )}
          </td>
        </tr>
      ) : null}
    </>
  );
}
