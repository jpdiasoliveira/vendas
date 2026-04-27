import type { Order } from "@/react-app/types";

export const PAID_STATUSES: readonly string[] = ["paid", "approved"];
export const ACTIVE_STATUSES: readonly string[] = ["pending", "paid", "shipped"];
export const HISTORY_STATUSES: readonly string[] = ["delivered", "cancelled"];

export const getOrderStatus = (order: Order): string =>
  (order.paymentStatus ?? order.status ?? "pending").toLowerCase();

const isPaid = (order: Order): boolean =>
  !!order.paymentStatus && PAID_STATUSES.includes(order.paymentStatus.toLowerCase());

export const isAwaitingShipment = (order: Order): boolean =>
  isPaid(order) && !order.trackingCode?.trim();

export type HistoryPeriodFilter = "todos" | "hoje" | "ontem" | "7dias" | "este_mes";

export function filterOrdersByPeriod(orders: Order[], period: HistoryPeriodFilter): Order[] {
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

export const PERIOD_LABELS: Record<HistoryPeriodFilter, string> = {
  todos: "Todos",
  hoje: "Hoje",
  ontem: "Ontem",
  "7dias": "Últimos 7 Dias",
  este_mes: "Este Mês",
};
