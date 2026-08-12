import { ChevronDown, ChevronRight, Eye, Link2, Package, RefreshCw } from "lucide-react";
import type { Order, OrderDetail } from "@/react-app/types";
import { StatusBadge } from "@/react-app/components/admin/StatusBadge";
import { formatCurrency, formatDate } from "@/react-app/utils/format";

type AdminOrderMobileCardProps = {
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

export function AdminOrderMobileCard({
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
}: AdminOrderMobileCardProps) {
  const actionBtn =
    "inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors sm:flex-none";

  return (
    <article className="overflow-hidden rounded-2xl border border-brand-primary/10 bg-surface-elevated">
      <button
        type="button"
        onClick={() => onOpenDetail(order.id)}
        className="w-full cursor-pointer p-4 text-left transition-colors hover:bg-surface-muted/50"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-content-muted">{formatDate(order.createdAt)}</p>
            <p className="break-words text-lg font-semibold text-content">
              {order.customerName?.trim() || "Cliente"}
            </p>
            <p className="mt-1 text-base text-content-muted">
              {order.shippingCity && order.shippingState ? `${order.shippingCity}/${order.shippingState}` : "—"}
            </p>
            <p className="mt-1 truncate text-sm text-content-muted" title={order.trackingCode ?? undefined}>
              Rastreio: {order.trackingCode ?? "—"}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <StatusBadge status={order.paymentStatus ?? order.status ?? "pending"} />
            <p className="mt-2 font-display text-xl font-bold text-content">{formatCurrency(order.total)}</p>
          </div>
        </div>
      </button>
      <div
        className="flex flex-col gap-2 border-t border-brand-primary/10 bg-surface-muted/40 p-3 sm:flex-row sm:flex-wrap"
        onClick={(e) => e.stopPropagation()}
      >
        {activeTab === "historico" ? (
          <button
            type="button"
            onClick={() => onOpenDetail(order.id)}
            className={`${actionBtn} bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/20`}
          >
            <Eye className="h-4 w-4 shrink-0" />
            Detalhes
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onExpand(order.id)}
          disabled={expandedLoading && isExpanded}
          className={`${actionBtn} bg-surface-elevated text-content-muted ring-1 ring-brand-primary/15 hover:bg-surface-muted disabled:opacity-60`}
        >
          {expandedLoading && isExpanded ? (
            <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
          ) : isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          Itens
        </button>
        <button
          type="button"
          onClick={() => onTracking(order.id)}
          className={`${actionBtn} bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/20`}
        >
          <Package className="h-4 w-4 shrink-0" />
          Rastreio
        </button>
        <button
          type="button"
          onClick={() => onCopyOrderShareLink(order)}
          className={`${actionBtn} bg-emerald-950/30 text-emerald-200 ring-1 ring-emerald-500/30`}
        >
          <Link2 className="h-4 w-4 shrink-0" />
          {shareCopiedOrderId === order.id ? "Copiado!" : "Copiar link"}
        </button>
      </div>
      {isExpanded ? (
        <div className="border-t border-brand-primary/10 bg-surface-muted/40 px-3 py-4">
          {expandedLoading ? (
            <div className="flex items-center gap-2 text-sm text-content-muted">
              <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
              Carregando itens…
            </div>
          ) : expandedError ? (
            <p className="text-sm text-red-300">Erro ao buscar itens.</p>
          ) : expandedOrder?.items?.length ? (
            <ul className="list-none space-y-2 text-sm">
              {expandedOrder.items.map((item, idx) => (
                <li
                  key={item.productId ?? idx}
                  className="flex items-center justify-between gap-2 rounded-xl border border-brand-primary/10 bg-surface-elevated px-3 py-3"
                >
                  <span className="min-w-0 break-words font-medium text-content">{item.productName}</span>
                  <span className="shrink-0 font-semibold text-content-muted">Qtd: {item.quantity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-sm text-content-muted">Nenhum item.</span>
          )}
        </div>
      ) : null}
    </article>
  );
}
