import { CreditCard, Loader2, QrCode } from "lucide-react";
import type { PaymentMethod } from "@/react-app/types/checkout";
import { formatCurrency } from "@/react-app/utils/format";

const PAYMENT_METHODS = [
  {
    id: "pix" as const,
    name: "Pix",
    description: "Pagamento instantâneo",
    icon: QrCode,
  },
  {
    id: "credit_card" as const,
    name: "Cartão de crédito",
    description: "Parcelamento em até 12x",
    icon: CreditCard,
  },
];

type CheckoutStepPaymentProps = {
  orderId: string | null;
  orderTotal: number | null;
  grandTotal: number;
  paymentMethod: PaymentMethod | null;
  setPaymentMethod: (method: PaymentMethod) => void;
  fieldErrors: Record<string, string>;
  stepError: string | null;
  apiError: string | null;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
};

export function CheckoutStepPayment({
  orderId,
  orderTotal,
  grandTotal,
  paymentMethod,
  setPaymentMethod,
  fieldErrors,
  stepError,
  apiError,
  isSubmitting,
  onBack,
  onSubmit,
}: CheckoutStepPaymentProps) {
  const displayTotal = orderTotal ?? grandTotal;

  return (
    <div className="space-y-4">
      {orderId ? (
        <p className="rounded-xl border border-brand-primary/15 bg-surface-muted/60 px-3 py-2 font-body text-sm text-content-muted">
          Pedido <span className="font-semibold text-content">#{orderId}</span> • Total confirmado:{" "}
          <span className="font-semibold text-brand-primary">{formatCurrency(displayTotal)}</span>
        </p>
      ) : (
        <p className="font-body text-sm text-content-muted">
          Total: <span className="font-semibold text-brand-primary">{formatCurrency(displayTotal)}</span>
        </p>
      )}

      {(apiError || stepError) && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-200">
          {apiError ?? stepError}
        </div>
      )}

      <div className="space-y-3">
        {PAYMENT_METHODS.map((method) => {
          const Icon = method.icon;
          const selected = paymentMethod === method.id;
          return (
            <button
              type="button"
              key={method.id}
              onClick={() => setPaymentMethod(method.id)}
              className={`flex min-h-[72px] w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
                selected
                  ? "border-brand-primary bg-brand-primary/5 shadow-md"
                  : "border-brand-primary/10 bg-surface-muted/40 hover:border-brand-primary/30"
              }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white">
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-bold text-content">{method.name}</h3>
                <p className="font-body text-sm text-content-muted">{method.description}</p>
              </div>
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? "border-brand-primary bg-brand-primary" : "border-brand-primary/20"
                }`}
                aria-hidden
              >
                {selected ? <div className="h-2.5 w-2.5 rounded-full bg-surface-elevated" /> : null}
              </div>
            </button>
          );
        })}
      </div>

      {fieldErrors.paymentMethod ? (
        <p role="alert" className="text-sm text-red-400">
          {fieldErrors.paymentMethod}
        </p>
      ) : null}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-brand-primary/20 font-body text-sm font-semibold text-content transition hover:bg-surface-muted disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={isSubmitting || !paymentMethod}
          className="flex min-h-[48px] flex-[2] items-center justify-center rounded-full bg-brand-primary font-body text-sm font-bold text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Processando…
            </>
          ) : (
            "Pagar agora"
          )}
        </button>
      </div>

      <p className="text-center font-body text-xs text-content-muted">
        Pagamento processado de forma segura pelo Mercado Pago
      </p>
    </div>
  );
}
