import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { apiFetch } from "@/react-app/services/api";
import type { StorePublicProfile } from "@/react-app/types";

export interface StoreSettingsData {
  displayName: string;
  logoUrl?: string | null;
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

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
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

  /** Ao voltar para a aba, atualiza em segundo plano (ex.: salvou no admin em outra aba). */
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
}

export function useStoreSettings() {
  const ctx = useContext(StoreSettingsContext);
  if (ctx === undefined) {
    throw new Error("useStoreSettings must be used within a StoreSettingsProvider");
  }
  return ctx;
}
