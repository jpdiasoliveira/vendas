#!/usr/bin/env node
/**
 * Prova de fogo operacional (Supabase) — complementa Etapas 1 e 3 sem depender do MP em sandbox.
 *
 * Uso:
 *   node scripts/operational-fire-test.mjs probe
 *   node scripts/operational-fire-test.mjs webhook-help
 *
 * Credenciais: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY no ambiente ou em `.dev.vars` na raiz.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadDotDevVars() {
  const p = join(root, ".dev.vars");
  if (!existsSync(p)) return {};
  const txt = readFileSync(p, "utf8");
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of txt.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

async function main() {
  const fileEnv = loadDotDevVars();
  const env = { ...fileEnv, ...process.env };
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const cmd = process.argv[2] || "probe";

  if (cmd === "webhook-help") {
    console.log(`
Etapa 1 — Webhook Mercado Pago (Worker real):

1) Terminal A: npx wrangler dev (ou npm run dev conforme seu fluxo; API em :8787)
2) .dev.vars: MERCADO_PAGO_ACCESS_TOKEN, REQUIRE_MP_WEBHOOK_SECRET=false (só dev)
3) Crie um pedido pela vitrine; no MP sandbox use um pagamento cujo external_reference = UUID do pedido.
4) POST (exemplo):

   curl -sS -X POST "http://127.0.0.1:8787/api/webhooks/mercadopago" \\
     -H "Content-Type: application/json" \\
     -d '{"type":"payment","data":{"id":"<ID_NUMERICO_DO_PAGAMENTO_NO_MP>"}}'

O Worker consulta GET /v1/payments/:id no MP e chama apply_mp_approval_with_order_lock no Supabase.
`);
    return;
  }

  if (cmd !== "probe") {
    console.error("Comando desconhecido:", cmd, "| use: probe | webhook-help");
    process.exit(1);
  }

  if (!url || !key) {
    console.error(
      "Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.dev.vars na raiz ou variáveis de ambiente)."
    );
    process.exit(1);
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  console.log("[probe] URL:", url.replace(/\/\/.*@/, "//***@"));

  const { data: stores, error: storesErr } = await sb
    .from("stores")
    .select("id,slug,status")
    .limit(5);
  if (storesErr) throw storesErr;
  console.log("[probe] amostra stores:", JSON.stringify(stores, null, 2));

  const fakeOrderId = "00000000-0000-4000-8000-000000000001";
  const { data: rpc1, error: rpcErr1 } = await sb.rpc(
    "apply_mp_approval_with_order_lock",
    { p_order_id: fakeOrderId, p_mp_payment_id: "999001" }
  );
  if (rpcErr1) throw rpcErr1;
  console.log("[probe] RPC pedido inexistente:", rpc1, "(esperado: skipped_not_found)");

  const { data: rpc2, error: rpcErr2 } = await sb.rpc(
    "apply_mp_approval_with_order_lock",
    { p_order_id: fakeOrderId, p_mp_payment_id: "999002" }
  );
  if (rpcErr2) throw rpcErr2;
  console.log("[probe] RPC repetido (mesmo pedido inexistente):", rpc2);

  const { data: auditSample, error: auditErr } = await sb
    .from("audit_logs")
    .select("id,action,resource_type,created_at")
    .order("created_at", { ascending: false })
    .limit(3);
  if (auditErr) {
    console.warn("[probe] audit_logs (opcional):", auditErr.message);
  } else {
    console.log("[probe] últimos audit_logs:", JSON.stringify(auditSample, null, 2));
  }

  console.log("[probe] concluído com sucesso.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
