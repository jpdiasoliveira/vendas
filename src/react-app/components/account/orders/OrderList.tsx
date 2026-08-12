import type { Order } from "@/react-app/types";
import { OrderCard } from "@/react-app/components/account/orders/OrderCard";

type OrderListProps = {
  orders: Order[];
  onPay: (orderId: string, total: number) => void;
};

export function OrderList({ orders, onPay }: OrderListProps) {
  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} onPay={onPay} />
      ))}
    </div>
  );
}
