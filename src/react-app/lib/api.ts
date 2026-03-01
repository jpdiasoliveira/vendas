/**
 * Cliente HTTP padronizado: sempre envia x-store-slug e trata resposta { success, data?, error? }.
 * Em sucesso retorna data; em erro lança Error(error).
 */
const STORE_SLUG = import.meta.env.VITE_STORE_SLUG;

export const apiFetch = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("x-store-slug", STORE_SLUG);

  const response = await fetch(endpoint, { ...options, headers });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (body as { error?: string })?.error || `Erro na requisição: ${response.status}`;
    throw new Error(message);
  }

  if (body && typeof body === "object" && body.success === false) {
    throw new Error((body as { error?: string }).error || "Erro desconhecido");
  }

  if (body && typeof body === "object" && body.success === true && "data" in body) {
    return body.data as T;
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
  const { getAccessToken } = await import("@/react-app/services/auth.service");
  const token = await getAccessToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("x-store-slug", STORE_SLUG);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(endpoint, { ...options, headers });
  const body = await response.json().catch(() => ({}));

  if (response.status === 401 || response.status === 403) {
    window.location.href = "/login";
    throw new Error((body as { error?: string })?.error || "Não autorizado");
  }

  if (!response.ok) {
    const message =
      (body as { error?: string })?.error || `Erro na requisição: ${response.status}`;
    throw new Error(message);
  }

  if (body && typeof body === "object" && body.success === false) {
    throw new Error((body as { error?: string }).error || "Erro desconhecido");
  }

  if (body && typeof body === "object" && body.success === true && "data" in body) {
    return body.data as T;
  }

  return body as T;
};
