// Pega o slug do .env configurado pelo Vite
const STORE_SLUG = import.meta.env.VITE_STORE_SLUG;

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  // Garantimos que o header de identificação da loja SEMPRE seja enviado
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("x-store-slug", STORE_SLUG); 

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro na requisição: ${response.status}`);
  }

  return response.json();
};