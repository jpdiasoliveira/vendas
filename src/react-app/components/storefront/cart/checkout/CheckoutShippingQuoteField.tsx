import { Loader2, MapPin } from "lucide-react";
import {
  CheckoutField,
  CheckoutInput,
} from "@/react-app/components/storefront/cart/checkout/CheckoutField";
import { formatCurrency } from "@/react-app/utils/format";

type CheckoutShippingQuoteFieldProps = {
  shippingCep: string;
  setShippingCep: (value: string) => void;
  onQuoteShipping: () => void;
  shippingLoading: boolean;
  shippingError: string | null;
  shippingFee: number;
  shippingOk: boolean;
  fieldErrors: Record<string, string>;
};

export function CheckoutShippingQuoteField({
  shippingCep,
  setShippingCep,
  onQuoteShipping,
  shippingLoading,
  shippingError,
  shippingFee,
  shippingOk,
  fieldErrors,
}: CheckoutShippingQuoteFieldProps) {
  return (
    <CheckoutField
      id="checkout-cep"
      label={
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          CEP para frete
        </span>
      }
      required
      error={fieldErrors.shippingCep ?? shippingError ?? undefined}
    >
      <div className="flex gap-2">
        <CheckoutInput
          id="checkout-cep"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          value={shippingCep}
          onChange={(e) => setShippingCep(e.target.value)}
          placeholder="00000-000"
          hasError={!!fieldErrors.shippingCep || !!shippingError}
          aria-label="CEP para cálculo de frete"
        />
        <button
          type="button"
          onClick={() => void onQuoteShipping()}
          disabled={shippingLoading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
        >
          {shippingLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {shippingLoading ? "…" : "Calcular"}
        </button>
      </div>
      {shippingOk ? (
        <p className="mt-2 text-sm text-accent">Frete: {formatCurrency(shippingFee)}</p>
      ) : (
        <p className="mt-1 text-xs text-content-muted">Informe o CEP e calcule o frete.</p>
      )}
    </CheckoutField>
  );
}
