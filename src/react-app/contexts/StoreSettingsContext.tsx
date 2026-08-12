import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/react-app/services/api";
import type { StoreCapabilities, StorePublicProfile } from "@/react-app/types";
import {
  hexToRgbTriplet,
  mixHexColor,
  normalizeStoreAccentColor,
  normalizeStorePrimaryColor,
} from "@/react-app/utils/brandColor";
import { storeSettingsQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";

export interface StoreSettingsData {
  displayName: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string | null;
  minimumOrderValue?: number | null;
  publicProfile?: StorePublicProfile;
  /** Direitos da assinatura (Bloco 2); ausente em respostas antigas ou erro parcial. */
  capabilities?: StoreCapabilities;
}

interface StoreSettingsContextType {
  settings: StoreSettingsData | null;
  loading: boolean;
  error: string | null;
  refetch: (opts?: { silent?: boolean }) => Promise<void>;
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

function ensureMetaTag(name: string): HTMLMetaElement | null {
  if (typeof document === "undefined") return null;
  let node = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute("name", name);
    document.head.appendChild(node);
  }
  return node;
}

export const StoreSettingsProvider = ({ children }: { children: ReactNode }) => {
  const query = useQuery({
    queryKey: storeSettingsQueryKey,
    queryFn: () => apiFetch<StoreSettingsData>("/api/store/settings"),
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const settings = query.data ?? null;
  const loading = query.isPending;
  const error =
    query.error instanceof Error
      ? query.error.message
      : query.error
        ? String(query.error)
        : null;

  const refetch = useCallback(async (opts?: { silent?: boolean }) => {
    void opts;
    await query.refetch();
  }, [query]);

  useEffect(() => {
    const root = document.documentElement;
    const primary = normalizeStorePrimaryColor(settings?.primaryColor ?? undefined);
    const accent = normalizeStoreAccentColor(settings?.publicProfile?.accentColor ?? undefined);
    const rgb = hexToRgbTriplet(primary) ?? "27, 67, 50";
    const hover = mixHexColor(primary, "#000000", 0.12);
    const soft = mixHexColor(primary, "#ffffff", 0.82);
    root.style.setProperty("--brand-primary", primary);
    root.style.setProperty("--brand-primary-rgb", rgb);
    root.style.setProperty("--brand-primary-hover", hover);
    root.style.setProperty("--brand-primary-soft", soft);
    root.style.setProperty("--brand-accent", accent);
    root.style.setProperty("--ds-accent", primary);
    root.style.setProperty("--ds-accent-soft", `rgba(${rgb}, 0.12)`);
    return () => {
      root.style.removeProperty("--brand-primary");
      root.style.removeProperty("--brand-primary-rgb");
      root.style.removeProperty("--brand-primary-hover");
      root.style.removeProperty("--brand-primary-soft");
      root.style.removeProperty("--brand-accent");
      root.style.removeProperty("--ds-accent");
      root.style.removeProperty("--ds-accent-soft");
    };
  }, [settings?.primaryColor, settings?.publicProfile?.accentColor]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const displayName = settings?.displayName?.trim() || "Sua Loja";
    const tagline = settings?.publicProfile?.tagline?.trim() || "Loja online";
    document.title = `${displayName} | ${tagline}`;

    const description =
      settings?.publicProfile?.shippingInfo?.trim() ||
      settings?.publicProfile?.tagline?.trim() ||
      `${displayName} - catálogo e pedidos online.`;
    const descriptionMeta = ensureMetaTag("description");
    if (descriptionMeta) descriptionMeta.setAttribute("content", description);

    const primary = normalizeStorePrimaryColor(settings?.primaryColor ?? undefined);
    const themeMeta = ensureMetaTag("theme-color");
    if (themeMeta) themeMeta.setAttribute("content", primary);
  }, [settings?.displayName, settings?.publicProfile?.shippingInfo, settings?.publicProfile?.tagline, settings?.primaryColor]);

  const contextValue = useMemo<StoreSettingsContextType>(
    () => ({
      settings,
      loading,
      error,
      refetch,
    }),
    [settings, loading, error, refetch]
  );

  return (
    <StoreSettingsContext.Provider value={contextValue}>
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useStoreSettings = () => {
  const ctx = useContext(StoreSettingsContext);
  if (ctx === undefined) {
    throw new Error("useStoreSettings must be used within a StoreSettingsProvider");
  }
  return ctx;
};

function mergeStorePreviewSettings(
  base: StoreSettingsData | null,
  patch: Partial<StoreSettingsData> | null
): StoreSettingsData | null {
  if (!patch || Object.keys(patch).length === 0) return base;
  if (!base) {
    return {
      displayName: patch.displayName?.trim() || "Sua Loja",
      logoUrl: patch.logoUrl ?? null,
      bannerUrl: patch.bannerUrl ?? null,
      primaryColor: patch.primaryColor ?? null,
      minimumOrderValue: patch.minimumOrderValue ?? null,
      publicProfile: (patch.publicProfile ?? {}) as StorePublicProfile,
      capabilities: patch.capabilities,
    };
  }
  return {
    ...base,
    ...patch,
    displayName: patch.displayName !== undefined ? patch.displayName : base.displayName,
    logoUrl: patch.logoUrl !== undefined ? patch.logoUrl : base.logoUrl,
    bannerUrl: patch.bannerUrl !== undefined ? patch.bannerUrl : base.bannerUrl,
    primaryColor: patch.primaryColor !== undefined ? patch.primaryColor : base.primaryColor,
    minimumOrderValue: patch.minimumOrderValue !== undefined ? patch.minimumOrderValue : base.minimumOrderValue,
    publicProfile: {
      ...(base.publicProfile ?? {}),
      ...(patch.publicProfile ?? {}),
    } as StorePublicProfile,
    capabilities: patch.capabilities !== undefined ? patch.capabilities : base.capabilities,
  };
}

/** Sobrepõe campos do rascunho do admin sobre `useStoreSettings()` (mesmos componentes da vitrine). */
export const StoreSettingsPreviewMergeProvider = ({
  merge,
  children,
}: {
  merge: Partial<StoreSettingsData> | null;
  children: ReactNode;
}) => {
  const parent = useStoreSettings();
  const mergedSettings = useMemo(
    () => mergeStorePreviewSettings(parent.settings, merge),
    [parent.settings, merge]
  );
  const value = useMemo<StoreSettingsContextType>(
    () => ({
      ...parent,
      settings: mergedSettings,
    }),
    [parent, mergedSettings]
  );
  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>;
};
