/**
 * Cliente HTTP padronizado: base em VITE_API_URL, envia x-store-slug e trata resposta { success, data?, error? }.
 */
const STORE_SLUG = import.meta.env.VITE_STORE_SLUG;

/** Base URL da API (ex.: http://127.0.0.1:8787 ou https://seu-worker.workers.dev). Sem trailing slash. */
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function buildApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}

async function parseJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trimStart().toLowerCase().startsWith("<!doctype")) {
    console.error("Erro: O Worker não respondeu, o Vite devolveu HTML.");
    throw new Error("Resposta inválida (HTML em vez de JSON). Verifique o proxy /api → Worker.");
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
  console.log("Fetching API:", url);

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
  console.log("Fetching API:", url);

  const { getAccessToken } = await import("@/react-app/services/auth.service");
  const token = await getAccessToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("x-store-slug", STORE_SLUG ?? "");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });
  const body = await parseJsonOrThrow(response);

  if (response.status === 401) {
    window.location.href = "/login";
    throw new Error((body as { error?: string })?.error || "Não autorizado");
  }
  if (response.status === 403) {
    throw new Error((body as { error?: string })?.error || "Acesso negado");
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
