import type { StoreSettingsData } from "@/react-app/contexts/StoreSettingsContext";

const MIN = 20;
const MAX = 100;
const DEFAULT = 40;

/** Altura do logo na vitrine (px), sempre entre MIN e MAX. */
export const clampStoreLogoHeightPx = (raw: number | null | undefined): number => {
  const n = typeof raw === "number" && Number.isFinite(raw) ? raw : Number(raw);
  if (!Number.isFinite(n)) return DEFAULT;
  return Math.min(MAX, Math.max(MIN, Math.round(n)));
};

export const isStoreLogoKnockoutWhite = (settings: StoreSettingsData | null | undefined): boolean =>
  settings?.publicProfile?.logoKnockoutWhite === true;

export const storeLogoHeightPx = (settings: StoreSettingsData | null | undefined): number =>
  clampStoreLogoHeightPx(settings?.publicProfile?.logoHeightPx ?? undefined);

/** Altura mínima da faixa da navbar para acomodar o logo + texto sem cortar. */
export const storeNavbarRowMinHeightPx = (logoHeightPx: number): number =>
  Math.max(72, Math.round(logoHeightPx + 28));
