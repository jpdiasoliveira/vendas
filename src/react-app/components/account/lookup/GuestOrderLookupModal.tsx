import { X } from "lucide-react";
import { GuestOrderDetail } from "@/react-app/components/account/lookup/GuestOrderDetail";
import { GuestOrderLookupForm } from "@/react-app/components/account/lookup/GuestOrderLookupForm";
import { OrderPaymentModal } from "@/react-app/components/account/orders/OrderPaymentModal";
import { useGuestOrderLookup } from "@/react-app/hooks/account/useGuestOrderLookup";

type GuestOrderLookupModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function GuestOrderLookupModal({ isOpen, onClose }: GuestOrderLookupModalProps) {
  const lookup = useGuestOrderLookup(isOpen, onClose);

  if (!lookup.keepMounted) return null;

  return (
    <>
      {isOpen && !lookup.payment.isOpen ? (
        <div className="fixed inset-0 z-[102] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fechar consulta"
            className="absolute inset-0 bg-surface/75 backdrop-blur-md"
            onClick={lookup.requestClose}
          />
          <div
            className="relative max-h-[min(90dvh,640px)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-brand-primary/15 bg-surface-elevated p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={lookup.order ? "Detalhes do pedido" : "Consultar pedido"}
          >
            <button
              type="button"
              onClick={lookup.requestClose}
              className="absolute right-4 top-4 rounded-full p-1 text-content-muted transition hover:bg-surface-muted hover:text-content"
              aria-label="Fechar"
            >
              <X className="h-6 w-6" />
            </button>

            {!lookup.order ? (
              <GuestOrderLookupForm
                orderId={lookup.orderIdInput}
                email={lookup.emailInput}
                loading={lookup.loading}
                onOrderIdChange={lookup.setOrderIdInput}
                onEmailChange={lookup.setEmailInput}
                onSearch={lookup.searchOrder}
              />
            ) : (
              <GuestOrderDetail
                order={lookup.order}
                copied={lookup.copied}
                canPay={lookup.canPay}
                onCopyId={lookup.copyOrderId}
                onPay={lookup.openPayment}
                onNewSearch={lookup.startNewSearch}
              />
            )}
          </div>
        </div>
      ) : null}

      <OrderPaymentModal payment={lookup.payment} guestEmail={lookup.guestEmail} />
    </>
  );
}

export default GuestOrderLookupModal;
