import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { apiFetch } from "@/react-app/services/api";
import type { StorePublicProfile } from "@/react-app/types";
import { hexToRgbTriplet, mixHexColor, normalizeStorePrimaryColor } from "@/react-app/utils/brandColor";

export interface StoreSettingsData {
  displayName: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string | null;
  minimumOrderValue?: number | null;
  publicProfile?: StorePublicProfile;
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
      root.style.setProperty("--brand-primary", "#1B4332");
      root.style.setProperty("--brand-primary-rgb", "27, 67, 50");
      root.style.setProperty("--brand-primary-hover", "#123325");
      root.style.setProperty("--brand-primary-soft", "#ECF3EF");
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

  return (
    <StoreSettingsContext.Provider value={{ settings, loading, error, refetch: fetchSettings }}>
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
