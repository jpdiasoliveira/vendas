import { AccountLoadingState } from "@/react-app/components/account/AccountLoadingState";
import { AccountPageShell } from "@/react-app/components/account/AccountPageShell";
import { EmptyOrders } from "@/react-app/components/account/orders/EmptyOrders";
import { OrderList } from "@/react-app/components/account/orders/OrderList";
import { OrderPaymentModal } from "@/react-app/components/account/orders/OrderPaymentModal";
import { useOrdersPage } from "@/react-app/hooks/account/useOrdersPage";

export default function OrdersPage() {
  const page = useOrdersPage();

  if (!page.authLoading && !page.user) {
    return null;
  }

  if (page.authLoading || (page.user && page.ordersLoading)) {
    return (
      <AccountPageShell title="Meus Pedidos" subtitle="Acompanhe o status das suas compras">
        <AccountLoadingState message="Carregando seus pedidos…" />
      </AccountPageShell>
    );
  }

  return (
    <AccountPageShell title="Meus Pedidos" subtitle="Acompanhe o status das suas compras">
      {page.orders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <OrderList orders={page.orders} onPay={page.payment.openPayment} />
      )}
      <OrderPaymentModal payment={page.payment} />
    </AccountPageShell>
  );
}
