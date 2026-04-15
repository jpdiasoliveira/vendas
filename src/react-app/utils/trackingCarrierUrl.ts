/**
 * Gera URL externa de rastreio quando o código parece objeto dos Correios (BR).
 * Caso contrário, retorna busca genérica (transportadora desconhecida).
 */
export const buildTrackingExternalUrl = (rawCode: string): string => {
  const code = rawCode.trim();
  if (!code) return "";
  const correios = /^[A-Z]{2}\d{9}BR$/i;
  if (correios.test(code)) {
    return `https://rastreio.correios.com.br/app/index.php?objeto=${encodeURIComponent(code.toUpperCase())}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`rastreio ${code}`)}`;
};
