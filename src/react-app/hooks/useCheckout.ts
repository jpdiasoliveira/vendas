import { useState } from "react";
import { apiFetch } from "@/react-app/lib/api";
import type { OrderWithItems } from "@/react-app/types";

interface CreateOrderData {
  orderId: number;
  status: string;
  total: number;
}

export function useCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (items: { id: string; name: string; price: number; quantity: number; image?: string; imageUrl?: string }[]) => {
    setIsProcessing(true);
    setError(null);
    try {
      const data = await apiFetch<CreateOrderData>("/api/orders", {
        method: "POST",
        body: JSON.stringify({ items }),
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

  const processPayment = async (
    orderId: number,
    paymentMethod: string
  ): Promise<{
    orderId?: number;
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
        orderId?: number;
        pixCode?: string;
        qrCodeBase64?: string;
        copyPaste?: string;
        qr_code?: string;
        qr_code_base64?: string;
        ticket_url?: string;
        init_point?: string;
      }>(`/api/orders/${orderId}/payment`, {
        method: "POST",
        body: JSON.stringify({ payment_method: paymentMethod }),
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

  const checkPaymentStatus = async (orderId: number): Promise<OrderWithItems> => {
    setIsProcessing(true);
    setError(null);
    try {
      return await apiFetch<OrderWithItems>(`/api/orders/${orderId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao verificar status. Tente novamente.";
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return { createOrder, processPayment, checkPaymentStatus, isProcessing, error };
}
