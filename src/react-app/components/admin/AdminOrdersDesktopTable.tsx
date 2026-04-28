import { Fragment } from "react";
import { RefreshCw, ChevronDown, ChevronRight, Eye, Package, Link2 } from "lucide-react";
import type { Order, OrderDetail } from "@/react-app/types";
import { StatusBadge } from "@/react-app/components/admin/StatusBadge";
import { formatCurrency, formatDate } from "@/react-app/utils/format";

type AdminOrdersDesktopTableProps = {
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

export const AdminOrdersDesktopTable = ({
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
}: AdminOrdersDesktopTableProps) => (
  <div className="hidden overflow-hidden rounded-2xl border border-[color:var(--brand-primary)]/10 bg-white/70 shadow-sm backdrop-blur-sm md:block">
    <div className="overflow-x-auto">
      <table
        className="w-full font-inter"
        role="table"
        aria-label={activeTab === "ativos" ? "Pedidos ativos" : "Histórico de pedidos"}
      >
        <thead>
          <tr className="border-b border-[color:var(--brand-primary)]/10 bg-[var(--brand-primary)]/5">
            <th className="px-4 py-4 text-left font-semibold text-[var(--brand-primary)]">Data</th>
            <th className="px-4 py-4 text-left font-semibold text-[var(--brand-primary)]">Cliente</th>
            <th className="px-4 py-4 text-left font-semibold text-[var(--brand-primary)]">Cidade/UF</th>
            <th className="px-4 py-4 text-left font-semibold text-[var(--brand-primary)]">Total</th>
            <th className="px-4 py-4 text-left font-semibold text-[var(--brand-primary)]">Rastreio</th>
            <th className="px-4 py-4 text-left font-semibold text-[var(--brand-primary)]">Status</th>
            <th className="w-0 px-4 py-4 text-left font-semibold text-[var(--brand-primary)]" />
          </tr>
        </thead>
        <tbody id={activeTab === "ativos" ? "orders-tab-ativos" : "orders-tab-historico"}>
          {displayedOrders.map((order) => (
            <Fragment key={order.id}>
              <tr
                onClick={() => onOpenDetail(order.id)}
                className="cursor-pointer border-b border-[color:var(--brand-primary)]/5 transition-colors hover:bg-[var(--brand-primary-soft)]/40"
              >
                <td className="whitespace-nowrap px-4 py-4 text-[#6D4C41]">{formatDate(order.createdAt)}</td>
                <td className="px-4 py-4 font-medium text-[var(--brand-primary)]">{order.customerName?.trim() || "Cliente"}</td>
                <td className="px-4 py-4 text-sm text-[#6D4C41]">
                  {order.shippingCity && order.shippingState ? `${order.shippingCity}/${order.shippingState}` : "—"}
                </td>
                <td className="px-4 py-4 font-bold text-[var(--brand-primary)]">{formatCurrency(order.total)}</td>
                <td className="max-w-[140px] truncate px-4 py-4 text-sm text-[#6D4C41]" title={order.trackingCode ?? undefined}>
                  {order.trackingCode ?? "—"}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={order.paymentStatus ?? order.status ?? "pending"} />
                </td>
                <td className="relative px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="relative z-10 flex flex-wrap items-center gap-2">
                    {activeTab === "historico" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onHistoryDetail(order.id);
                        }}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
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
                        onExpand(order.id);
                      }}
                      disabled={loadingItemsOrderId === order.id}
                      className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-lg bg-[#6D4C41]/10 px-3 py-2 text-sm font-medium text-[#6D4C41] transition-colors hover:bg-[#6D4C41]/20 disabled:cursor-not-allowed disabled:opacity-60"
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
                        onTracking(order.id);
                      }}
                      className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--brand-primary)]/10 px-3 py-2 text-sm font-medium text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary)]/20"
                    >
                      <Package className="h-3.5 w-3.5" />
                      Inserir Rastreio
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyOrderShareLink(order);
                      }}
                      className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100"
                      title="URL da página de confirmação (cliente acompanha e vê o rastreio)"
                    >
                      <Link2 className="h-3.5 w-3.5 shrink-0" />
                      {shareCopiedOrderId === order.id ? "Copiado!" : "Copiar link de rastreio"}
                    </button>
                  </div>
                </td>
              </tr>
              {expandedOrderId === order.id && (
                <tr key={`${order.id}-items`} className="border-b border-slate-200 bg-slate-50">
                  <td colSpan={7} className="px-4 py-4">
                    {loadingItemsOrderId === order.id ? (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Carregando itens…
                      </div>
                    ) : itemsErrorOrderId === order.id ? (
                      <p className="text-sm text-red-600">Erro ao buscar itens. Tente novamente.</p>
                    ) : orderDetailsCache[order.id]?.items?.length ? (
                      <ul className="list-none space-y-2 text-sm">
                        {orderDetailsCache[order.id].items.map((item, idx) => (
                          <li
                            key={item.productId ?? idx}
                            className="flex items-center justify-between rounded-lg border border-slate-100 bg-white/80 px-3 py-1.5"
                          >
                            <span className="font-medium text-slate-800">{item.productName}</span>
                            <span className="font-semibold text-slate-600">Qtd: {item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-slate-500">Nenhum item.</span>
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
);
