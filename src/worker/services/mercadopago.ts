/**
 * Serviço de integração com a API do Mercado Pago.
 * Encapsula criação de pagamento PIX e consulta de status.
 */

const MP_API_BASE = "https://api.mercadopago.com";

export interface CreatePIXParams {
  orderId: string;
  total: number;
  payerEmail: string;
  idempotencyKey: string;
  notificationUrl?: string;
}

export interface CreatePIXResult {
  paymentId: number;
  status: string;
  qrCodeBase64: string | null;
  copyPaste: string | null;
}

interface MPPaymentResponse {
  id: number;
  status: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code_base64?: string;
      qr_code?: string;
    };
  };
}

/**
 * Cria um pagamento PIX no Mercado Pago.
 * Retorna QR Code em base64 e código Copia e Cola.
 */
export async function createPaymentPIX(
  accessToken: string,
  params: CreatePIXParams
): Promise<CreatePIXResult> {
  const url = `${MP_API_BASE}/v1/payments`;
  const body = {
    transaction_amount: params.total,
    payment_method_id: "pix",
    payer: {
      email: params.payerEmail,
    },
    external_reference: params.orderId,
    ...(params.notificationUrl && { notification_url: params.notificationUrl }),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": params.idempotencyKey,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as MPPaymentResponse & { message?: string; error?: string };

  if (!res.ok) {
    const msg = data.message ?? data.error ?? `MP API error: ${res.status}`;
    throw new Error(msg);
  }

  const transactionData = data.point_of_interaction?.transaction_data;
  return {
    paymentId: data.id,
    status: data.status ?? "pending",
    qrCodeBase64: transactionData?.qr_code_base64 ?? null,
    copyPaste: transactionData?.qr_code ?? null,
  };
}

export interface CreatePreferenceParams {
  orderId: string;
  total: number;
  payerEmail: string;
  notificationUrl?: string;
  /** URLs absolutas de retorno do Checkout Pro (sucesso, falha, pendente). */
  backUrls?: {
    success: string;
    failure: string;
    pending: string;
  };
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
  }>;
}

export interface CreatePreferenceResult {
  init_point: string;
  id: string;
}

/** Corpo JSON da API de preferências (sucesso ou erro). */
interface MPPreferenceApiBody {
  init_point?: string;
  id?: string | number;
  message?: string;
  error?: string;
}

/**
 * Cria uma preferência de pagamento (Checkout Pro) no Mercado Pago.
 * Retorna a URL de redirecionamento (init_point) e o ID da preferência.
 */
export async function createPreference(
  accessToken: string,
  params: CreatePreferenceParams
): Promise<CreatePreferenceResult> {
  const url = `${MP_API_BASE}/checkout/preferences`;
  
  const body: Record<string, unknown> = {
    items: params.items,
    payer: {
      email: params.payerEmail,
    },
    external_reference: params.orderId,
    ...(params.notificationUrl && { notification_url: params.notificationUrl }),
    payment_methods: {
      excluded_payment_types: [
        { id: "ticket" }, // Exclui boleto conforme solicitado
      ],
    },
  };

  if (params.backUrls) {
    body.back_urls = {
      success: params.backUrls.success,
      failure: params.backUrls.failure,
      pending: params.backUrls.pending,
    };
    body.auto_return = "approved";
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as MPPreferenceApiBody;

  if (!res.ok) {
    const msg = data.message ?? data.error ?? `MP API error: ${res.status}`;
    throw new Error(msg);
  }

  const initPoint = data.init_point?.trim();
  const prefId = data.id;
  if (!initPoint || prefId == null || String(prefId).trim() === "") {
    throw new Error("Resposta inválida do Mercado Pago: faltam init_point ou id.");
  }

  return {
    init_point: initPoint,
    id: String(prefId),
  };
}

export interface GetPaymentResult {
  id: number;
  status: string;
  external_reference?: string;
}

/**
 * Busca o status de um pagamento pelo ID (para webhook).
 */
export async function getPayment(
  accessToken: string,
  paymentId: number
): Promise<GetPaymentResult> {
  const url = `${MP_API_BASE}/v1/payments/${paymentId}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = (await res.json()) as GetPaymentResult & { message?: string; error?: string };

  if (!res.ok) {
    const detail = data.message ?? data.error ?? "";
    const suffix = detail ? `: ${detail}` : "";
    throw new Error(`Mercado Pago (${res.status})${suffix}`);
  }

  return {
    id: data.id,
    status: data.status,
    external_reference: data.external_reference,
  };
}
