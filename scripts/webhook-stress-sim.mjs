#!/usr/bin/env node
/**
 * Etapa 3 — Simula o mesmo webhook Mercado Pago 3 vezes (intervalo 1s).
 *
 * Pré-requisitos:
 * - Worker no ar (ex.: http://127.0.0.1:8787)
 * - REQUIRE_MP_WEBHOOK_SECRET=false ou secret configurado e assinatura válida
 * - MERCADO_PAGO_ACCESS_TOKEN no Worker (GET /v1/payments/:id deve responder)
 * - Pagamento real/sandbox com external_reference = UUID do pedido
 *
 * Uso:
 *   node scripts/webhook-stress-sim.mjs --base http://127.0.0.1:8787 --payment-id 123456789
 *
 * O que observar:
 * - Respostas HTTP 200 em todas as chamadas.
 * - No Supabase: um único pedido em `approved` com aquele payment_id; e-mails de
 *   "pago" não devem duplicar (notifyOrderPaid só em outcome `paid`, não em `idempotent_skip`).
 */

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i < 0 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const base = (arg("--base") || "http://127.0.0.1:8787").replace(/\/$/, "");
  const paymentId = arg("--payment-id");
  if (!paymentId) {
    console.error("Uso: node scripts/webhook-stress-sim.mjs --base http://127.0.0.1:8787 --payment-id <ID_NUMERICO_MP>");
    process.exit(1);
  }

  const url = `${base}/api/webhooks/mercadopago`;
  const body = JSON.stringify({ type: "payment", data: { id: String(paymentId) } });

  for (let i = 1; i <= 3; i += 1) {
    const t0 = Date.now();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const text = await res.text();
    const ms = Date.now() - t0;
    console.log(`[${i}/3] ${res.status} em ${ms}ms —`, text.slice(0, 200));
    if (i < 3) await sleep(1000);
  }
  console.log("Concluído. Verifique audit_logs / Resend para duplicidade de e-mail.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
