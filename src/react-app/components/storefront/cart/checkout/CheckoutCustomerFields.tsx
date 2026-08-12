import {
  CheckoutField,
  CheckoutInput,
} from "@/react-app/components/storefront/cart/checkout/CheckoutField";

type CheckoutCustomerFieldsProps = {
  customerName: string;
  setCustomerName: (value: string) => void;
  customerPhone: string;
  setCustomerPhone: (value: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (value: string) => void;
  fieldErrors: Record<string, string>;
};

export function CheckoutCustomerFields({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  deliveryAddress,
  setDeliveryAddress,
  fieldErrors,
}: CheckoutCustomerFieldsProps) {
  return (
    <>
      <CheckoutField id="checkout-name" label="Nome do cliente" error={fieldErrors.customerName}>
        <CheckoutInput
          id="checkout-name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Como devemos chamar você?"
          hasError={!!fieldErrors.customerName}
          aria-describedby={fieldErrors.customerName ? "checkout-name-error" : undefined}
        />
      </CheckoutField>

      <CheckoutField id="checkout-phone" label="Telefone" required error={fieldErrors.customerPhone}>
        <CheckoutInput
          id="checkout-phone"
          type="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="(00) 00000-0000"
          hasError={!!fieldErrors.customerPhone}
          aria-describedby={fieldErrors.customerPhone ? "checkout-phone-error" : undefined}
        />
      </CheckoutField>

      <CheckoutField
        id="checkout-address"
        label="Endereço de entrega"
        required
        error={fieldErrors.deliveryAddress}
      >
        <CheckoutInput
          id="checkout-address"
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          placeholder="Rua, número, bairro, cidade..."
          hasError={!!fieldErrors.deliveryAddress}
          aria-describedby={fieldErrors.deliveryAddress ? "checkout-address-error" : undefined}
        />
      </CheckoutField>
    </>
  );
}
