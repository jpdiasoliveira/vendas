import { useCallback, useRef, useState } from "react";
import { z } from "zod";
import { useCheckout } from "@/react-app/hooks/useCheckout";
import { useToast } from "@/react-app/providers/ToastProvider";
import { checkoutPaymentSchema } from "@/react-app/schemas/checkoutFlow";
import type { CheckoutPixData, PaymentMethod } from "@/react-app/types/checkout";

type PaymentTarget = {
  orderId: string;
  total: number;
  guestEmail?: string;
};

type PaymentPhase = "select" | "pix";

function flattenPaymentError(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function useOrderPayment(onPaid: () => void) {
  const { processPayment, isProcessing, error: apiError } = useCheckout();
  const { showToast } = useToast();

  const [target, setTarget] = useState<PaymentTarget | null>(null);
  const [phase, setPhase] = useState<PaymentPhase>("select");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [pixData, setPixData] = useState<CheckoutPixData | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [stepError, setStepError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const submitLockRef = useRef(false);

  const openPayment = useCallback((orderId: string, total: number, guestEmail?: string) => {
    setTarget({ orderId, total, guestEmail: guestEmail?.trim() || undefined });
    setPhase("select");
    setPaymentMethod(null);
    setPixData(null);
    setFieldErrors({});
    setStepError(null);
  }, []);

  const closePayment = useCallback(() => {
    setTarget(null);
    setPhase("select");
    setPaymentMethod(null);
    setPixData(null);
    setFieldErrors({});
    setStepError(null);
    submitLockRef.current = false;
  }, []);

  const finishPayment = useCallback(() => {
    closePayment();
    onPaid();
  }, [closePayment, onPaid]);

  const submitPayment = useCallback(async () => {
    if (!target) return;
    setFieldErrors({});
    setStepError(null);

    const parsed = checkoutPaymentSchema.safeParse({
      paymentMethod: paymentMethod ?? undefined,
    });
    if (!parsed.success) {
      setFieldErrors(flattenPaymentError(parsed.error));
      return;
    }
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsLocked(true);

    try {
      const data = await processPayment(
        target.orderId,
        parsed.data.paymentMethod,
        target.guestEmail ?? null,
      );

      if (parsed.data.paymentMethod === "credit_card" && data.init_point) {
        window.location.href = data.init_point;
        return;
      }

      const pixBase64 = data.qrCodeBase64 ?? data.qr_code_base64 ?? "";
      const pixCopy = data.copyPaste ?? data.pixCode ?? data.qr_code ?? "";
      if (parsed.data.paymentMethod === "pix" && (pixBase64 || pixCopy)) {
        setPixData({ copyPaste: pixCopy, qrCodeBase64: pixBase64 });
        setPhase("pix");
        return;
      }

      const message =
        "Não foi possível iniciar o pagamento. Tente novamente ou escolha outra forma.";
      setStepError(message);
      showToast({ type: "error", message });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao processar pagamento. Tente novamente.";
      showToast({ type: "error", message });
    } finally {
      submitLockRef.current = false;
      setIsLocked(false);
    }
  }, [target, paymentMethod, processPayment, showToast]);

  return {
    isOpen: target != null,
    target,
    phase,
    paymentMethod,
    setPaymentMethod,
    pixData,
    fieldErrors,
    stepError,
    apiError,
    isSubmitting: isProcessing || isLocked,
    openPayment,
    closePayment,
    finishPayment,
    submitPayment,
  };
}
