import { useCallback, useState } from "react";
import type { UserContext } from "@/react-app/services/auth.service";
import {
  checkoutGuestEmailSchema,
  checkoutIdentitySchema,
} from "@/react-app/schemas/checkoutFlow";
import { flattenZodErrors } from "@/react-app/hooks/storefront/checkout/checkoutFlowUtils";

type UseCheckoutCustomerParams = {
  shippingCep: string;
  shippingOk: boolean;
  requireLoginToCheckout: boolean;
  user: UserContext | null;
  clearFieldErrors: () => void;
};

export function useCheckoutCustomer({
  shippingCep,
  shippingOk,
  requireLoginToCheckout,
  user,
  clearFieldErrors,
}: UseCheckoutCustomerParams) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const validateIdentityStep = useCallback(
    (setFieldErrors: (errors: Record<string, string>) => void): boolean => {
      clearFieldErrors();
      const parsed = checkoutIdentitySchema.safeParse({
        customerName,
        customerPhone,
        deliveryAddress,
        shippingCep,
        guestEmail,
      });
      if (!parsed.success) {
        setFieldErrors(flattenZodErrors(parsed.error));
        return false;
      }
      if (!shippingOk) {
        setFieldErrors({ shippingCep: "Calcule o frete antes de continuar." });
        return false;
      }
      if (requireLoginToCheckout && !user) {
        setShowLoginModal(true);
        return false;
      }
      if (!requireLoginToCheckout && !user) {
        const emailParsed = checkoutGuestEmailSchema(true).safeParse(guestEmail);
        if (!emailParsed.success) {
          setFieldErrors({
            guestEmail: emailParsed.error.issues[0]?.message ?? "E-mail inválido.",
          });
          return false;
        }
      }
      return true;
    },
    [
      customerName,
      customerPhone,
      deliveryAddress,
      shippingCep,
      guestEmail,
      shippingOk,
      requireLoginToCheckout,
      user,
      clearFieldErrors,
    ],
  );

  return {
    showLoginModal,
    setShowLoginModal,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    deliveryAddress,
    setDeliveryAddress,
    guestEmail,
    setGuestEmail,
    validateIdentityStep,
  };
}
