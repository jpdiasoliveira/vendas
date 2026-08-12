import { useMemo } from "react";
import type { StoreSettingsData } from "@/react-app/contexts/StoreSettingsContext";
import {
  hexToRgbTriplet,
  mixHexColor,
  normalizeStoreAccentColor,
  normalizeStorePrimaryColor,
} from "@/react-app/utils/brandColor";

export const useAdminPreviewBrandCss = (merge: Partial<StoreSettingsData> | null) => {
  const brand = normalizeStorePrimaryColor(merge?.primaryColor ?? undefined);
  const accent = normalizeStoreAccentColor(merge?.publicProfile?.accentColor ?? undefined);
  const rgb = hexToRgbTriplet(brand);

  return useMemo(() => {
    const hover = mixHexColor(brand, "#000000", 0.12);
    const soft = mixHexColor(brand, "#ffffff", 0.82);
    return {
      ["--brand-primary" as string]: brand,
      ["--brand-primary-rgb" as string]: rgb ?? "51, 65, 85",
      ["--brand-primary-hover" as string]: hover,
      ["--brand-primary-soft" as string]: soft,
      ["--brand-accent" as string]: accent,
      ["--ds-accent" as string]: brand,
      ["--ds-accent-soft" as string]: `rgba(${rgb ?? "51, 65, 85"}, 0.12)`,
    };
  }, [brand, accent, rgb]);
};

export const policiesBodyPresenceKey = (merge: Partial<StoreSettingsData> | null) => {
  const pp = merge?.publicProfile;
  const d = pp?.deliveryPolicy?.trim() ? "1" : "0";
  const r = pp?.returnsPolicy?.trim() ? "1" : "0";
  const p = pp?.privacyPolicy?.trim() ? "1" : "0";
  return `${d}${r}${p}`;
};
