/**
 * URLs da vitrine para retorno do Checkout Pro (Mercado Pago).
 * Mantido separado das rotas para testes e clareza.
 */

export function resolveStorefrontBaseUrl(env: Env, request: Request): string {
  const fromEnv = env.STOREFRONT_BASE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const origin = request.headers.get("Origin")?.trim().replace(/\/$/, "");
  if (origin) return origin;
  return "http://localhost:5173";
}

export function buildOrderConfirmationUrl(
  storefrontBase: string,
  orderId: string,
  guestEmail: string | null | undefined,
  mpResult: "success" | "failure" | "pending"
): string {
  const u = new URL(`${storefrontBase.replace(/\/$/, "")}/order/${encodeURIComponent(orderId)}/confirmation`);
  const ge = guestEmail?.trim();
  if (ge) u.searchParams.set("guestEmail", ge);
  u.searchParams.set("mp_result", mpResult);
  return u.toString();
}

export function isValidGuestEmail(email: string): boolean {
  const t = email.trim();
  return t.length > 4 && t.includes("@") && !t.includes(" ");
}
