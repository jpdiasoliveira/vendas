import { AccountLoadingState } from "@/react-app/components/account/AccountLoadingState";
import { AccountPageShell } from "@/react-app/components/account/AccountPageShell";
import { OrderConfirmationBanners } from "@/react-app/components/account/confirmation/OrderConfirmationBanners";
import { OrderConfirmationCard } from "@/react-app/components/account/confirmation/OrderConfirmationCard";
import { OrderConfirmationError } from "@/react-app/components/account/confirmation/OrderConfirmationError";
import { useOrderConfirmation } from "@/react-app/hooks/account/useOrderConfirmation";

export default function OrderConfirmationPage() {
  const data = useOrderConfirmation();

  return (
    <AccountPageShell title="Pedido">
      <div className="mx-auto max-w-lg">
        <OrderConfirmationBanners
          successMessage={data.mpSuccessBanner}
          noticeMessage={data.mpBanner}
        />

        {data.loading && !data.order ? (
          <AccountLoadingState message="Carregando pedido…" />
        ) : data.error ? (
          <OrderConfirmationError message={data.error} />
        ) : data.order ? (
          <OrderConfirmationCard
            order={data.order}
            stockConflict={data.stockConflict}
            paymentApproved={data.paymentApproved}
            logistics={data.logistics}
            rawTracking={data.rawTracking}
            trackingUrl={data.trackingUrl}
            isShippedStatus={data.isShippedStatus}
          />
        ) : null}
      </div>
    </AccountPageShell>
  );
}
