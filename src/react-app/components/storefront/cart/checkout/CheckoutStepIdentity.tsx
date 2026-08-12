import { Loader2 } from "lucide-react";
import { CheckoutCustomerFields } from "@/react-app/components/storefront/cart/checkout/CheckoutCustomerFields";
import { CheckoutShippingQuoteField } from "@/react-app/components/storefront/cart/checkout/CheckoutShippingQuoteField";
import {
  CheckoutField,
  CheckoutInput,
} from "@/react-app/components/storefront/cart/checkout/CheckoutField";
import type { UserContext } from "@/react-app/services/auth.service";

type CheckoutStepIdentityProps = {
  user: UserContext | null;
  customerName: string;
  setCustomerName: (value: string) => void;
  customerPhone: string;
  setCustomerPhone: (value: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (value: string) => void;
  guestEmail: string;
  setGuestEmail: (value: string) => void;
  shippingCep: string;
  setShippingCep: (value: string) => void;
  onQuoteShipping: () => void;
  shippingLoading: boolean;
  shippingError: string | null;
  shippingFee: number;
  shippingOk: boolean;
  requireLoginToCheckout: boolean;
  fieldErrors: Record<string, string>;
  isSubmitting: boolean;
  onBack: () => void;
  onContinue: () => void;
};

export function CheckoutStepIdentity(props: CheckoutStepIdentityProps) {
  return (
    <div className="space-y-4">
      <CheckoutCustomerFields
        customerName={props.customerName}
        setCustomerName={props.setCustomerName}
        customerPhone={props.customerPhone}
        setCustomerPhone={props.setCustomerPhone}
        deliveryAddress={props.deliveryAddress}
        setDeliveryAddress={props.setDeliveryAddress}
        fieldErrors={props.fieldErrors}
      />

      <CheckoutShippingQuoteField
        shippingCep={props.shippingCep}
        setShippingCep={props.setShippingCep}
        onQuoteShipping={props.onQuoteShipping}
        shippingLoading={props.shippingLoading}
        shippingError={props.shippingError}
        shippingFee={props.shippingFee}
        shippingOk={props.shippingOk}
        fieldErrors={props.fieldErrors}
      />

      {!props.requireLoginToCheckout && !props.user ? (
        <CheckoutField
          id="checkout-guest-email"
          label="E-mail para confirmação"
          required
          error={props.fieldErrors.guestEmail}
        >
          <CheckoutInput
            id="checkout-guest-email"
            type="email"
            value={props.guestEmail}
            onChange={(e) => props.setGuestEmail(e.target.value)}
            placeholder="seu@email.com"
            autoComplete="email"
            hasError={!!props.fieldErrors.guestEmail}
            aria-label="E-mail checkout sem login"
          />
        </CheckoutField>
      ) : null}

      {props.requireLoginToCheckout && !props.user ? (
        <p className="rounded-xl border border-brand-primary/20 bg-accent-soft px-3 py-2 text-sm text-content">
          Faça login para finalizar a compra.
        </p>
      ) : null}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={props.onBack}
          disabled={props.isSubmitting}
          className="flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-brand-primary/20 font-body text-sm font-semibold text-content transition hover:bg-surface-muted disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={() => void props.onContinue()}
          disabled={props.isSubmitting}
          className="flex min-h-[48px] flex-[2] items-center justify-center rounded-full bg-brand-primary font-body text-sm font-bold text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {props.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Preparando…
            </>
          ) : (
            "Ir para pagamento"
          )}
        </button>
      </div>
    </div>
  );
}
