/**
 * Validação de assinatura HMAC dos webhooks Mercado Pago (header x-signature).
 * @see https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */

function parseXSignature(header: string | null): { ts: string; v1: string } | null {
  if (!header?.trim()) return null;
  let ts = "";
  let v1 = "";
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "ts") ts = value;
    else if (key === "v1") v1 = value;
  }
  return ts && v1 ? { ts, v1 } : null;
}

function normalizeDataIdForManifest(dataId: string): string {
  const t = dataId.trim();
  if (/^[a-zA-Z0-9]+$/.test(t)) return t.toLowerCase();
  return t;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Margem de tolerância para o timestamp `ts` (segundos). */
const TS_TOLERANCE_SEC = 600;

function tsIsFresh(tsStr: string): boolean {
  const tsNum = Number(tsStr);
  if (!Number.isFinite(tsNum) || tsNum <= 0) return false;
  const tsSec = tsNum > 1e12 ? Math.floor(tsNum / 1000) : Math.floor(tsNum);
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - tsSec) <= TS_TOLERANCE_SEC;
}

export type MercadoPagoWebhookVerifyEnv = {
  MERCADO_PAGO_WEBHOOK_SECRET?: string;
};

export type MercadoPagoWebhookVerifyOptions = {
  /**
   * true: exige `MERCADO_PAGO_WEBHOOK_SECRET` configurado e assinatura válida (produção multi-tenant).
   * false: sem secret → aceita; com secret → valida (desenvolvimento / legado).
   */
  requireSecretAndSignature: boolean;
};

/**
 * Valida notificação conforme política.
 * Modo estrito: sem secret ou assinatura inválida → ok: false (sem atalhos).
 */
export async function verifyMercadoPagoWebhookSignature(
  env: MercadoPagoWebhookVerifyEnv,
  headers: Headers,
  requestUrl: string,
  dataId: string | null | undefined,
  options: MercadoPagoWebhookVerifyOptions
): Promise<{ ok: boolean; reason?: string }> {
  const secret = env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  const mandatory = options.requireSecretAndSignature;

  if (mandatory) {
    if (!secret) {
      return {
        ok: false,
        reason: "REQUIRE_MP_WEBHOOK_SECRET ativo: MERCADO_PAGO_WEBHOOK_SECRET não configurado",
      };
    }
    return verifySignatureWithSecret(secret, headers, requestUrl, dataId);
  }

  if (!secret) {
    return { ok: true };
  }
  return verifySignatureWithSecret(secret, headers, requestUrl, dataId);
}

async function verifySignatureWithSecret(
  secret: string,
  headers: Headers,
  requestUrl: string,
  dataId: string | null | undefined
): Promise<{ ok: boolean; reason?: string }> {
  const parsed = parseXSignature(headers.get("x-signature"));
  if (!parsed) return { ok: false, reason: "x-signature ausente ou inválido" };

  if (!tsIsFresh(parsed.ts)) return { ok: false, reason: "ts fora da janela permitida" };

  const urlObj = new URL(requestUrl);
  const fromQuery = urlObj.searchParams.get("data.id");
  const id = String(fromQuery ?? dataId ?? "").trim();
  if (!id) return { ok: false, reason: "data.id ausente (body ou query)" };

  const requestId = headers.get("x-request-id")?.trim() ?? "";
  const segments: string[] = [];
  segments.push(`id:${normalizeDataIdForManifest(id)}`);
  if (requestId) segments.push(`request-id:${requestId}`);
  segments.push(`ts:${parsed.ts}`);
  const manifest = `${segments.join(";")};`;

  const expected = (await hmacSha256Hex(secret, manifest)).toLowerCase();
  const received = parsed.v1.trim().toLowerCase();
  if (expected.length !== received.length || expected !== received) {
    return { ok: false, reason: "assinatura HMAC não confere" };
  }
  return { ok: true };
}
