/**
 * Cliente HTTP padronizado: base em VITE_API_URL, envia x-store-slug e trata resposta { success, data?, error? }.
 */
const STORE_SLUG = import.meta.env.VITE_STORE_SLUG;

/** Em dev usa URL relativa para o proxy do Vite (/api → 127.0.0.1:8787). Em prod usa VITE_API_URL. */
const API_BASE = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function buildApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}

async function parseJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trimStart().toLowerCase().startsWith("<!doctype")) {
    console.error("API respondeu com HTML em vez de JSON. URL:", response.url);
    throw new Error(
      "Resposta inválida (HTML). Verifique: 1) Worker rodando (wrangler dev em http://127.0.0.1:8787); 2) Proxy no vite.config.ts para /api → http://127.0.0.1:8787."
    );
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    console.error("Erro ao fazer parse do JSON:", text.slice(0, 200));
    throw new Error("Resposta da API não é JSON válido.");
  }
}

export const apiFetch = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = buildApiUrl(endpoint);

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("x-store-slug", STORE_SLUG ?? "");

  const response = await fetch(url, { ...options, headers });
  const body = await parseJsonOrThrow(response);

  if (!response.ok) {
    const message =
      (body as { error?: string })?.error || `Erro na requisição: ${response.status}`;
    throw new Error(message);
  }

  const b = body as { success?: boolean; data?: T; error?: string };
  if (body && typeof body === "object" && b.success === false) {
    throw new Error(b.error || "Erro desconhecido");
  }

  if (body && typeof body === "object" && b.success === true && "data" in body) {
    return b.data as T;
  }

  return body as T;
};

/**
 * Cliente HTTP para rotas /api/admin/*: envia x-store-slug e Authorization: Bearer <token>.
 * Use nas páginas do painel admin (requer usuário logado via Supabase Auth).
 */
export const adminApiFetch = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = buildApiUrl(endpoint);

  const { getAccessToken } = await import("@/react-app/services/auth.service");
  const token = await getAccessToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("x-store-slug", STORE_SLUG ?? "");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });
  const body = await parseJsonOrThrow(response);

  if (response.status === 401) {
    const msg = (body as { error?: string })?.error || "Não autorizado";
    try {
      sessionStorage.setItem("lastAuthError", JSON.stringify({ status: 401, error: msg }));
    } catch {
      /* ignore */
    }
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error(msg);
  }
  if (response.status === 403) {
    const msg = (body as { error?: string })?.error || "Acesso negado";
    try {
      sessionStorage.setItem("lastAuthError", JSON.stringify({ status: 403, error: msg }));
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  if (!response.ok) {
    const message =
      (body as { error?: string })?.error || `Erro na requisição: ${response.status}`;
    throw new Error(message);
  }

  const b = body as { success?: boolean; data?: T; error?: string };
  if (body && typeof body === "object" && b.success === false) {
    throw new Error(b.error || "Erro desconhecido");
  }

  if (body && typeof body === "object" && b.success === true && "data" in body) {
    return b.data as T;
  }

  return body as T;
};
