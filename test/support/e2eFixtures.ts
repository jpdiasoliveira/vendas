/** Prefixo de fixtures E2E — pedidos guest usam e-mail `e2e-test+*@example.com`. */
export const E2E_FIXTURE_PREFIX = "e2e-test";

export const E2E_STORE_SLUG = process.env.E2E_STORE_SLUG ?? "demo-store";

export const E2E_WORKER_BASE = process.env.E2E_WORKER_BASE ?? "http://127.0.0.1:8787";

export function uniqueE2eEmail(): string {
  return `${E2E_FIXTURE_PREFIX}+${Date.now()}@example.com`;
}

export const E2E_DEFAULT_CEP = "01310-100";

export const E2E_CHECKOUT = {
  customerName: "Cliente E2E",
  customerPhone: "11999990000",
  deliveryAddress: "Rua E2E, 100 - São Paulo",
} as const;

type ApiRequestContext = import("@playwright/test").APIRequestContext;

/** Retorna true quando a loja demo responde com ao menos um produto. */
export async function isE2eStoreReady(request: ApiRequestContext): Promise<boolean> {
  try {
    const health = await request.get(`${E2E_WORKER_BASE}/api/health`);
    if (!health.ok()) return false;

    const products = await request.get(`${E2E_WORKER_BASE}/api/products`, {
      headers: { "x-store-slug": E2E_STORE_SLUG },
    });
    if (!products.ok()) return false;

    const body = (await products.json()) as { success?: boolean; data?: unknown[] };
    return Boolean(body.success && Array.isArray(body.data) && body.data.length > 0);
  } catch {
    return false;
  }
}

export const E2E_SKIP_REASON =
  "Pré-requisitos E2E ausentes: .dev.vars + demo-store seedada com produtos ativos (ver .agents/docs/testing.md).";
