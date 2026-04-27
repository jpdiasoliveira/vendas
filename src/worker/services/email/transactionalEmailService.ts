import type { TransactionalEmailPayload, TransactionalTemplateId } from "./types.js";

const DEFAULT_PRIMARY = "#1B4332";

const isLikelyEmail = (to: string | null | undefined): boolean => {
  if (!to || typeof to !== "string") return false;
  const t = to.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
};

const buildHtml = (templateId: TransactionalTemplateId, ctx: Record<string, unknown>): string => {
  const orderId = String(ctx.orderId ?? "");
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  if (templateId === "order_paid") {
    const mp = ctx.mp_payment_id != null ? `<p>Referência do pagamento: <strong>${esc(String(ctx.mp_payment_id))}</strong></p>` : "";
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/></head>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#333;max-width:32rem">
  <h1 style="color:${DEFAULT_PRIMARY}">Pagamento confirmado</h1>
  <p>Seu pedido <strong>#${esc(orderId)}</strong> foi marcado como <strong>pago</strong>.</p>
  ${mp}
  <p>Obrigado pela preferência.</p>
</body></html>`;
  }
  if (templateId === "order_created") {
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/></head>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#333">
  <h1 style="color:${DEFAULT_PRIMARY}">Pedido recebido</h1>
  <p>Recebemos o pedido <strong>#${esc(orderId)}</strong>.</p>
</body></html>`;
  }
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/></head>
<body style="font-family:system-ui,sans-serif">
  <p>Seu pedido <strong>#${esc(orderId)}</strong> foi enviado.</p>
</body></html>`;
};

/**
 * Envio transacional via [Resend](https://resend.com).
 * Sem `RESEND_API_KEY`: não envia (não quebra checkout nem webhooks).
 */
export const sendTransactionalEmail = async (
  env: Env,
  payload: TransactionalEmailPayload
): Promise<{ ok: true; skipped: boolean; providerId?: string } | { ok: false; error: string }> => {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: true, skipped: true };
  }
  if (!isLikelyEmail(payload.to)) {
    return { ok: true, skipped: true };
  }

  const from =
    env.RESEND_FROM_EMAIL?.trim() ||
    "Pedidos <onboarding@resend.dev>";

  const html = buildHtml(payload.templateId, payload.context);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.to!.trim()],
        subject: payload.subject,
        html,
      }),
    });

    const raw = await res.text();
    let body: { id?: string; message?: string } = {};
    try {
      body = raw ? (JSON.parse(raw) as { id?: string; message?: string }) : {};
    } catch {
      /* ignore */
    }

    if (!res.ok) {
      const msg = body.message || raw.slice(0, 200) || res.statusText;
      console.error("[transactionalEmail] Resend error:", res.status, msg);
      return { ok: false, error: msg };
    }

    return { ok: true, skipped: false, providerId: body.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[transactionalEmail] fetch failed:", msg);
    return { ok: false, error: msg };
  }
};

export const queueOrderCreatedEmail = async (
  env: Env,
  params: {
    storeId: string;
    orderId: string;
    to: string | null;
    total?: number;
    shippingCep?: string | null;
  }
): Promise<void> => {
  await sendTransactionalEmail(env, {
    to: params.to,
    subject: `Pedido ${params.orderId} — confirmação`,
    templateId: "order_created",
    context: {
      storeId: params.storeId,
      orderId: params.orderId,
      total: params.total ?? null,
      shippingCep: params.shippingCep ?? null,
    },
  });
};

export const queueOrderPaidEmail = async (
  env: Env,
  params: { storeId: string; orderId: string; to: string | null; mpPaymentId?: number | null }
): Promise<void> => {
  const result = await sendTransactionalEmail(env, {
    to: params.to,
    subject: `Pedido ${params.orderId} — pagamento confirmado`,
    templateId: "order_paid",
    context: {
      storeId: params.storeId,
      orderId: params.orderId,
      mp_payment_id: params.mpPaymentId ?? null,
    },
  });
  if (!result.ok) {
    console.error("[queueOrderPaidEmail]", result.error);
  }
};

export const queueOrderShippedEmail = async (
  env: Env,
  params: { storeId: string; orderId: string; to: string | null }
): Promise<void> => {
  await sendTransactionalEmail(env, {
    to: params.to,
    subject: `Pedido ${params.orderId} — enviado`,
    templateId: "order_shipped",
    context: { storeId: params.storeId, orderId: params.orderId },
  });
};
