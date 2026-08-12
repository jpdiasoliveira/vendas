/** Item enviado ao criar pedido — preço exigido pelo schema da API; servidor valida no catálogo. */
export type CheckoutOrderLineInput = {
  id: string;
  quantity: number;
  name: string;
};

export type CheckoutStep = "summary" | "identity" | "payment" | "success";

export type PaymentMethod = "pix" | "credit_card";

export type CheckoutPixData = {
  copyPaste: string;
  qrCodeBase64: string;
};

export type CreateOrderResponse = {
  orderId: string;
  status: string;
  total: number;
  idempotent?: boolean;
};

export type ProcessPaymentResponse = {
  orderId?: string;
  pixCode?: string;
  qrCodeBase64?: string;
  copyPaste?: string;
  qr_code?: string;
  qr_code_base64?: string;
  ticket_url?: string;
  init_point?: string;
};
