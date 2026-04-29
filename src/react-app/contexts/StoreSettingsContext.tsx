import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { apiFetch } from "@/react-app/services/api";
import type { StoreCapabilities, StorePublicProfile } from "@/react-app/types";
import { hexToRgbTriplet, mixHexColor, normalizeStorePrimaryColor } from "@/react-app/utils/brandColor";

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
  const [settings, setSettings] = useState<StoreSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // fetchSettings: GET /api/store/settings e atualiza estado. useCallback([]): `refetch` estável para consumidores e para o useMemo do `contextValue`.
  const fetchSettings = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await apiFetch<StoreSettingsData>("/api/store/settings");
      setSettings(data ?? null);
      if (silent) setError(null);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "Erro ao carregar configurações");
        setSettings(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const root = document.documentElement;
    const primary = normalizeStorePrimaryColor(settings?.primaryColor ?? undefined);
    const rgb = hexToRgbTriplet(primary) ?? "27, 67, 50";
    const hover = mixHexColor(primary, "#000000", 0.12);
    const soft = mixHexColor(primary, "#ffffff", 0.82);
    root.style.setProperty("--brand-primary", primary);
    root.style.setProperty("--brand-primary-rgb", rgb);
    root.style.setProperty("--brand-primary-hover", hover);
    root.style.setProperty("--brand-primary-soft", soft);
    return () => {
      root.style.removeProperty("--brand-primary");
      root.style.removeProperty("--brand-primary-rgb");
      root.style.removeProperty("--brand-primary-hover");
      root.style.removeProperty("--brand-primary-soft");
    };
  }, [settings?.primaryColor]);

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

  useEffect(() => {
    let tid: ReturnType<typeof setTimeout> | undefined;
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(tid);
      tid = setTimeout(() => void fetchSettings({ silent: true }), 400);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearTimeout(tid);
    };
  }, [fetchSettings]);

  // contextValue: estado da loja + refetch; mesma ideia do Auth/Cart — referência estável evita re-render em massa (ex.: Navbar + Home) quando o Provider reexecuta sem mudança semântica.
  // useMemo([settings, loading, error, fetchSettings]): só novo objeto quando um destes campos muda; `fetchSettings` já é estável via useCallback.
  const contextValue = useMemo<StoreSettingsContextType>(
    () => ({
      settings,
      loading,
      error,
      refetch: fetchSettings,
    }),
    [settings, loading, error, fetchSettings]
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
