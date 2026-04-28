import { Fragment } from "react";
import { RefreshCw, ChevronDown, ChevronRight, Eye, Package, Link2 } from "lucide-react";
import type { Order, OrderDetail } from "@/react-app/types";
import { StatusBadge } from "@/react-app/components/admin/StatusBadge";
import { formatCurrency, formatDate } from "@/react-app/utils/format";

type AdminOrdersMobileListProps = {
  displayedOrders: Order[];
  activeTab: "ativos" | "historico";
  expandedOrderId: string | null;
  loadingItemsOrderId: string | null;
  itemsErrorOrderId: string | null;
  orderDetailsCache: Record<string, OrderDetail>;
  shareCopiedOrderId: string | null;
  onOpenDetail: (id: string) => void;
  onExpand: (id: string) => void;
  onHistoryDetail: (id: string) => void;
  onTracking: (id: string) => void;
  onCopyOrderShareLink: (order: Order) => void;
};

export const AdminOrdersMobileList = ({
  displayedOrders,
  activeTab,
  expandedOrderId,
  loadingItemsOrderId,
  itemsErrorOrderId,
  orderDetailsCache,
  shareCopiedOrderId,
  onOpenDetail,
  onExpand,
  onHistoryDetail,
  onTracking,
  onCopyOrderShareLink,
}: AdminOrdersMobileListProps) => (
  <div className="space-y-3 md:hidden">
    {displayedOrders.map((order) => (
      <Fragment key={`m-${order.id}`}>
        <article className="overflow-hidden rounded-2xl border border-[color:var(--brand-primary)]/10 bg-white/90 shadow-sm">
          <button
            type="button"
            onClick={() => onOpenDetail(order.id)}
            className="w-full cursor-pointer p-4 text-left transition-colors hover:bg-[var(--brand-primary-soft)]/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#6D4C41]">{formatDate(order.createdAt)}</p>
                <p className="break-words text-lg font-semibold text-[var(--brand-primary)]">
                  {order.customerName?.trim() || "Cliente"}
                </p>
                <p className="mt-1 text-base text-[#5a4035]">
                  {order.shippingCity && order.shippingState ? `${order.shippingCity}/${order.shippingState}` : "—"}
                </p>
                <p className="mt-1 truncate text-sm text-[#6D4C41]" title={order.trackingCode ?? undefined}>
                  Rastreio: {order.trackingCode ?? "—"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <StatusBadge status={order.paymentStatus ?? order.status ?? "pending"} />
                <p className="mt-2 font-playfair text-xl font-bold text-[var(--brand-primary)]">{formatCurrency(order.total)}</p>
              </div>
            </div>
          </button>
          <div
            className="flex flex-col gap-2 border-t border-[color:var(--brand-primary)]/10 bg-slate-50/90 p-3 sm:flex-row sm:flex-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            {activeTab === "historico" && (
              <button
                type="button"
                onClick={() => onHistoryDetail(order.id)}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-base font-medium text-blue-800 ring-1 ring-blue-200/80 transition-colors hover:bg-blue-100 sm:flex-none"
              >
                <Eye className="h-4 w-4 shrink-0" />
                Ver detalhes
              </button>
            )}
            <button
              type="button"
              onClick={() => onExpand(order.id)}
              disabled={loadingItemsOrderId === order.id}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-base font-medium text-[#6D4C41] ring-1 ring-[color:var(--brand-primary)]/15 transition-colors hover:bg-[var(--brand-primary-soft)]/45 disabled:opacity-60 sm:flex-none"
            >
              {loadingItemsOrderId === order.id ? (
                <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
              ) : expandedOrderId === order.id ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )}
              Ver Itens
            </button>
            <button
              type="button"
              onClick={() => onTracking(order.id)}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)]/10 px-3 py-2.5 text-base font-medium text-[var(--brand-primary)] ring-1 ring-[color:var(--brand-primary)]/20 transition-colors hover:bg-[var(--brand-primary)]/15 sm:flex-none"
            >
              <Package className="h-4 w-4 shrink-0" />
              Rastreio
            </button>
            <button
              type="button"
              onClick={() => onCopyOrderShareLink(order)}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-base font-medium text-emerald-900 ring-1 ring-emerald-200/90 transition-colors hover:bg-emerald-100 sm:flex-none"
              title="Link da página de confirmação (cliente vê rastreio)"
            >
              <Link2 className="h-4 w-4 shrink-0" />
              {shareCopiedOrderId === order.id ? "Copiado!" : "Copiar link de rastreio"}
            </button>
          </div>
          {expandedOrderId === order.id && (
            <div className="border-t border-slate-200 bg-slate-50 px-3 py-4">
              {loadingItemsOrderId === order.id ? (
                <div className="flex items-center gap-2 text-base text-slate-600">
                  <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
                  Carregando itens…
                </div>
              ) : itemsErrorOrderId === order.id ? (
                <p className="text-base text-red-600">Erro ao buscar itens. Tente novamente.</p>
              ) : orderDetailsCache[order.id]?.items?.length ? (
                <ul className="list-none space-y-2 text-base">
                  {orderDetailsCache[order.id].items.map((item, idx) => (
                    <li
                      key={item.productId ?? idx}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white/90 px-3 py-3"
                    >
                      <span className="min-w-0 break-words font-medium text-slate-800">{item.productName}</span>
                      <span className="shrink-0 font-semibold text-slate-600">Qtd: {item.quantity}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-base text-slate-500">Nenhum item.</span>
              )}
            </div>
          )}
        </article>
      </Fragment>
    ))}
  </div>
);
