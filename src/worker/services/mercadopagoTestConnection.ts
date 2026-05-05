/**
 * Validação leve: GET /users/me com o Bearer do lojista.
 */

const MP_API_BASE = "https://api.mercadopago.com";

export type MpConnectionTestResult =
  | { ok: true; userId: number | string; nickname?: string }
  | { ok: false; status: number; message: string };

export const testMercadoPagoAccessToken = async (accessToken: string): Promise<MpConnectionTestResult> => {
  const t = accessToken.trim();
  if (!t) return { ok: false, status: 400, message: "Token vazio." };
  const res = await fetch(`${MP_API_BASE}/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${t}`,
    },
  });
  const raw = await res.text();
  let body: { id?: number; nickname?: string; message?: string; error?: string } = {};
  try {
    body = raw ? (JSON.parse(raw) as typeof body) : {};
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = body.message ?? body.error ?? (raw.slice(0, 200) || res.statusText);
    return { ok: false, status: res.status, message: msg };
  }
  const id = body.id;
  if (id == null) return { ok: false, status: 502, message: "Resposta inválida do Mercado Pago." };
  return { ok: true, userId: id, nickname: body.nickname };
};
