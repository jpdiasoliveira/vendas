/**
 * Cliente HTTP da aplicação: base em VITE_API_URL, envia x-store-slug
 * e normaliza respostas no formato { success, data?, error? }.
 * Usado por hooks e componentes para chamadas à API do Worker.
 */

const STORE_SLUG = import.meta.env.VITE_STORE_SLUG;
const API_BASE = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/** Monta a URL absoluta do endpoint (respeitando proxy em dev). */
function buildApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}

/**
 * Lê o body da resposta como texto e faz parse JSON.
 * Em caso de HTML ou JSON inválido, loga o nome da função e relança.
 */
async function parseJsonOrThrow(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trimStart().toLowerCase().startsWith("<!doctype")) {
    console.error("[api.parseJsonOrThrow] Resposta foi HTML em vez de JSON. URL:", response.url);
    throw new Error(
      "Resposta inválida (HTML). Verifique: Worker rodando (wrangler dev) e proxy no vite.config para /api."
    );
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("[api.parseJsonOrThrow] Falha ao fazer parse do JSON:", text.slice(0, 200), e);
    throw new Error("Resposta da API não é JSON válido.");
  }
}

/**
 * Requisição autenticada apenas por store (x-store-slug). Para rotas públicas e usuário loja.
 * Retorna data quando success === true; caso contrário lança com mensagem de error.
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("x-store-slug", STORE_SLUG ?? "");

  /** Evita ciclo com auth.service (login) e não envia Bearer no POST público de login. */
  if (!/\/api\/login(\?|$)/.test(endpoint)) {
    const { getAccessToken } = await import("@/react-app/services/auth.service");
    const token = await getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });
  const body = await parseJsonOrThrow(response);

  if (!response.ok) {
    const message = (body as { error?: string })?.error || `Erro na requisição: ${response.status}`;
    console.error("[api.apiFetch] Requisição falhou:", endpoint, response.status, message);
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
}

/**
 * Upload de imagem para POST /api/admin/upload (multipart/form-data).
 * Retorna a publicUrl da imagem no Supabase Storage. Exige admin logado.
 */
export async function adminUploadImage(file: File): Promise<{ publicUrl: string }> {
  const url = buildApiUrl("/api/admin/upload");
  const { getAccessToken } = await import("@/react-app/services/auth.service");
  const token = await getAccessToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers = new Headers();
  headers.set("x-store-slug", STORE_SLUG ?? "");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { method: "POST", headers, body: formData });
  const body = await parseJsonOrThrow(response);

  if (response.status === 401 || response.status === 403) {
    const msg = (body as { error?: string })?.error || "Não autorizado";
    try {
      sessionStorage.setItem("lastAuthError", JSON.stringify({ status: response.status, error: msg }));
    } catch {
      /* ignore */
    }
    if (response.status === 401 && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    console.error("[api.adminUploadImage] Não autorizado:", response.status, msg);
    throw new Error(msg);
  }
  if (!response.ok) {
    const message = (body as { error?: string })?.error || `Erro no upload: ${response.status}`;
    console.error("[api.adminUploadImage] Upload falhou:", response.status, message);
    throw new Error(message);
  }
  const b = body as { success?: boolean; publicUrl?: string; error?: string };
  if (b.success === true && typeof b.publicUrl === "string") {
    return { publicUrl: b.publicUrl };
  }
  throw new Error((b as { error?: string })?.error || "Resposta inválida do upload.");
}

/**
 * Cliente HTTP para rotas /api/admin/*: envia x-store-slug e Authorization Bearer.
 * Use nas páginas do painel admin (requer usuário logado).
 */
export async function adminApiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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
    console.error("[api.adminApiFetch] 401 em:", endpoint, msg);
    throw new Error(msg);
  }
  if (response.status === 403) {
    const msg = (body as { error?: string })?.error || "Acesso negado";
    try {
      sessionStorage.setItem("lastAuthError", JSON.stringify({ status: 403, error: msg }));
    } catch {
      /* ignore */
    }
    console.error("[api.adminApiFetch] 403 em:", endpoint, msg);
    throw new Error(msg);
  }

  if (!response.ok) {
    const message = (body as { error?: string })?.error || `Erro na requisição: ${response.status}`;
    console.error("[api.adminApiFetch] Falha em:", endpoint, response.status, message);
    const err = new Error(message) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  const b = body as { success?: boolean; data?: T; error?: string };
  if (body && typeof body === "object" && b.success === false) {
    throw new Error(b.error || "Erro desconhecido");
  }
  if (body && typeof body === "object" && b.success === true && "data" in body) {
    return b.data as T;
  }
  return body as T;
}
