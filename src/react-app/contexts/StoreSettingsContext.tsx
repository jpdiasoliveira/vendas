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
import { normalizeStorePrimaryColor } from "@/react-app/utils/brandColor";

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
    root.style.setProperty("--brand-primary", primary);
    return () => {
      root.style.setProperty("--brand-primary", "#1B4332");
    };
  }, [settings?.primaryColor]);

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
