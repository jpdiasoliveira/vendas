/**
 * Gera URL externa de rastreio quando o código parece objeto dos Correios (BR).
 * Caso contrário, retorna busca genérica (transportadora desconhecida).
 */
export const buildTrackingExternalUrl = (rawCode: string): string => {
  const code = rawCode.trim();
  if (!code) return "";
  const upper = code.toUpperCase();
  /** Objeto nacional dos Correios (ex.: AA123456789BR). */
  const correiosObjeto = /^[A-Z]{2}\d{9}BR$/;
  if (correiosObjeto.test(upper)) {
    return `https://rastreio.correios.com.br/app/index.php?objeto=${encodeURIComponent(upper)}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`rastreio ${code}`)}`;
};
