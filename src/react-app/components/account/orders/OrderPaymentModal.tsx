import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { CheckoutOrderSuccess } from "@/react-app/components/storefront/cart/checkout/CheckoutOrderSuccess";
import { CheckoutStepPayment } from "@/react-app/components/storefront/cart/checkout/CheckoutStepPayment";
import { CheckoutSubmitOverlay } from "@/react-app/components/storefront/cart/checkout/CheckoutSubmitOverlay";
import type { useOrderPayment } from "@/react-app/hooks/account/useOrderPayment";

type OrderPayment = ReturnType<typeof useOrderPayment>;

type OrderPaymentModalProps = {
  payment: OrderPayment;
  guestEmail?: string;
};

export function OrderPaymentModal({ payment, guestEmail = "" }: OrderPaymentModalProps) {
  if (!payment.isOpen || !payment.target || typeof document === "undefined") return null;

  const { orderId, total } = payment.target;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Fechar pagamento"
        className="absolute inset-0 bg-surface/80 backdrop-blur-md"
        onClick={payment.closePayment}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pagamento do pedido"
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-brand-primary/15 bg-surface-elevated shadow-2xl sm:rounded-3xl"
      >
        <div className="relative border-b border-brand-primary/10 px-5 py-4">
          <button
            type="button"
            onClick={payment.closePayment}
            className="absolute right-4 top-4 rounded-full p-1 text-content-muted transition hover:bg-surface-muted hover:text-content"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="pr-10 font-display text-lg font-bold text-content">
            {payment.phase === "pix" ? "Pague com Pix" : "Forma de pagamento"}
          </h2>
        </div>

        <div className="scrollbar-slim relative min-h-0 flex-1 overflow-y-auto p-5">
          <CheckoutSubmitOverlay active={payment.isSubmitting && payment.phase === "select"} />

          {payment.phase === "select" ? (
            <CheckoutStepPayment
              orderId={orderId}
              orderTotal={total}
              grandTotal={total}
              paymentMethod={payment.paymentMethod}
              setPaymentMethod={payment.setPaymentMethod}
              fieldErrors={payment.fieldErrors}
              stepError={payment.stepError}
              apiError={payment.apiError}
              isSubmitting={payment.isSubmitting}
              onBack={payment.closePayment}
              onSubmit={payment.submitPayment}
            />
          ) : (
            <CheckoutOrderSuccess
              orderId={orderId}
              orderTotal={total}
              pixData={payment.pixData}
              guestEmail={guestEmail || payment.target?.guestEmail || ""}
              onClose={payment.finishPayment}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
