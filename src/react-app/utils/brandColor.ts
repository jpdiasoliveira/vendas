/** Cor primária da loja (#RRGGBB) ou padrão da marca. */
export const normalizeStorePrimaryColor = (input: string | null | undefined): string => {
  const t = (input ?? "").trim();
  if (/^#[0-9A-Fa-f]{6}$/i.test(t)) return t.startsWith("#") ? t : `#${t}`;
  return "#1B4332";
};

/** Retorna `r, g, b` para usar em `rgba(..., a)` ou null se inválido. */
export const hexToRgbTriplet = (hex: string): string | null => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
};
