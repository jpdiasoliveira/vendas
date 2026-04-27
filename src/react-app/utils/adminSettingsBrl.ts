/** Formatação de valor mínimo de pedido (R$) no painel de configurações. */
export function formatBRL(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return value.toFixed(2).replace(".", ",");
}

export function parseBRL(str: string): number | null {
  const cleaned = str.replace(/\D/g, "");
  if (cleaned === "") return null;
  const value = Number(cleaned) / 100;
  return Number.isNaN(value) ? null : value;
}
