import { useState } from "react";
import { apiFetch } from "@/react-app/services/api";
import type { OrderWithItems } from "@/react-app/types";

interface CreateOrderData {
  orderId: string;
  status: string;
  total: number;
  /** true quando o servidor reconheceu replay da mesma Idempotency-Key. */
  idempotent?: boolean;
}

export const useCheckout = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Cria pedido com itens e opcionalmente nome, telefone e endereço. */
  const createOrder = async (
    items: { id: string; name: string; price: number; quantity: number; image?: string; imageUrl?: string }[],
    options?: {
      customerName?: string;
      customerPhone?: string;
      deliveryAddress?: string;
      guestEmail?: string;
      shippingPostalCode?: string;
      couponCode?: string;
    }
  ) => {
    setIsProcessing(true);
    setError(null);
    try {
      const idempotencyKey = crypto.randomUUID();
      const body: Record<string, unknown> = { items, idempotencyKey };
      if (options?.customerName?.trim()) body.customerName = options.customerName.trim();
      if (options?.customerPhone?.trim()) body.customerPhone = options.customerPhone.trim();
      if (options?.deliveryAddress?.trim()) body.deliveryAddress = options.deliveryAddress.trim();
      if (options?.guestEmail?.trim()) body.guestEmail = options.guestEmail.trim();
      if (options?.shippingPostalCode?.trim()) body.shippingPostalCode = options.shippingPostalCode.trim();
      if (options?.couponCode?.trim()) body.couponCode = options.couponCode.trim();
      const data = await apiFetch<CreateOrderData>("/api/orders", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(body),
      });
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao processar pedido. Tente novamente.";
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  /** Inicia pagamento (PIX, boleto ou cartão) para um pedido já criado. */
  const processPayment = async (
    orderId: string,
    paymentMethod: string,
    guestEmail?: string | null
  ): Promise<{
    orderId?: string;
    pixCode?: string;
    qrCodeBase64?: string;
    copyPaste?: string;
    qr_code?: string;
    qr_code_base64?: string;
    ticket_url?: string;
    init_point?: string;
  }> => {
    setIsProcessing(true);
    setError(null);
    try {
      const data = await apiFetch<{
        orderId?: string;
        pixCode?: string;
        qrCodeBase64?: string;
        copyPaste?: string;
        qr_code?: string;
        qr_code_base64?: string;
        ticket_url?: string;
        init_point?: string;
      }>(`/api/orders/${orderId}/payment`, {
        method: "POST",
        body: JSON.stringify({
          payment_method: paymentMethod,
          ...(guestEmail?.trim() ? { guestEmail: guestEmail.trim() } : {}),
        }),
      });
      return data ?? {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao processar pagamento. Tente novamente.";
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const checkPaymentStatus = async (
    orderId: string,
    guestEmail?: string | null
  ): Promise<OrderWithItems> => {
    setIsProcessing(true);
    setError(null);
    try {
      const qs = guestEmail?.trim()
        ? `?guestEmail=${encodeURIComponent(guestEmail.trim())}`
        : "";
      return await apiFetch<OrderWithItems>(`/api/orders/${orderId}${qs}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao verificar status. Tente novamente.";
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return { createOrder, processPayment, checkPaymentStatus, isProcessing, error };
};
