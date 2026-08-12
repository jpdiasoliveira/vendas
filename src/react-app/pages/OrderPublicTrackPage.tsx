import { AccountLoadingState } from "@/react-app/components/account/AccountLoadingState";
import { AccountPageShell } from "@/react-app/components/account/AccountPageShell";
import { PublicTrackForm } from "@/react-app/components/account/tracking/PublicTrackForm";
import { PublicTrackResult } from "@/react-app/components/account/tracking/PublicTrackResult";
import { usePublicOrderTrack } from "@/react-app/hooks/account/usePublicOrderTrack";

export default function OrderPublicTrackPage() {
  const track = usePublicOrderTrack();

  return (
    <AccountPageShell title="Acompanhar pedido">
      <div className="mx-auto max-w-lg">
        <PublicTrackForm
          orderId={track.orderIdInput}
          email={track.emailInput}
          onOrderIdChange={track.setOrderIdInput}
          onEmailChange={track.setEmailInput}
          onSubmit={track.handleSubmit}
        />

        {track.showLoading ? <AccountLoadingState message="Carregando…" /> : null}

        {track.order ? (
          <PublicTrackResult
            order={track.order}
            paymentApproved={track.paymentApproved}
            preparing={track.preparing}
            logistics={track.logistics}
            rawTracking={track.rawTracking}
            trackingUrl={track.trackingUrl}
          />
        ) : null}
      </div>
    </AccountPageShell>
  );
}
