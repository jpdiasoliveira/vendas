import {
  DEFAULT_BRAND_ACCENT,
  DEFAULT_BRAND_PRIMARY,
} from "@/constants/brandDefaults";

export { DEFAULT_BRAND_PRIMARY, DEFAULT_BRAND_PRIMARY_RGB } from "@/constants/brandDefaults";

/** Cor primária da loja (#RRGGBB) ou padrão do design system. */
export const normalizeStorePrimaryColor = (input: string | null | undefined): string => {
  const t = (input ?? "").trim();
  if (/^#[0-9A-Fa-f]{6}$/i.test(t)) return t.startsWith("#") ? t : `#${t}`;
  return DEFAULT_BRAND_PRIMARY;
};

/** Cor de destaque (fim do gradiente em CTAs). */
export const normalizeStoreAccentColor = (input: string | null | undefined): string => {
  const t = (input ?? "").trim();
  if (/^#[0-9A-Fa-f]{6}$/i.test(t)) return t.startsWith("#") ? t : `#${t}`;
  return DEFAULT_BRAND_ACCENT;
};

function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  const toHex = (n: number) => clampByte(n).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/** Mistura uma cor com preto/branco para criar variantes de hover/borda. */
export const mixHexColor = (hex: string, mixWith: "#000000" | "#ffffff", ratio: number): string => {
  const rgb = hexToRgb(normalizeStorePrimaryColor(hex));
  const mix = hexToRgb(mixWith);
  if (!rgb || !mix) return normalizeStorePrimaryColor(hex);
  const r = rgb.r + (mix.r - rgb.r) * ratio;
  const g = rgb.g + (mix.g - rgb.g) * ratio;
  const b = rgb.b + (mix.b - rgb.b) * ratio;
  return rgbToHex({ r, g, b });
};

/** Retorna `r, g, b` para usar em `rgba(..., a)` ou null se inválido. */
export const hexToRgbTriplet = (hex: string): string | null => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
};
