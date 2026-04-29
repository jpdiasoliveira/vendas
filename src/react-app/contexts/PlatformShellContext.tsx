import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type PlatformShellContextValue = {
  storesListVersion: number;
  notifyStoresListChanged: () => void;
  newStoreModalOpen: boolean;
  setNewStoreModalOpen: (open: boolean) => void;
};

const PlatformShellContext = createContext<PlatformShellContextValue | null>(null);

export const PlatformShellProvider = ({ children }: { children: ReactNode }) => {
  const [storesListVersion, setStoresListVersion] = useState(0);
  const [newStoreModalOpen, setNewStoreModalOpen] = useState(false);

  const notifyStoresListChanged = useCallback(() => {
    setStoresListVersion((v) => v + 1);
  }, []);

  const value = useMemo(
    () => ({
      storesListVersion,
      notifyStoresListChanged,
      newStoreModalOpen,
      setNewStoreModalOpen,
    }),
    [storesListVersion, notifyStoresListChanged, newStoreModalOpen]
  );

  return <PlatformShellContext.Provider value={value}>{children}</PlatformShellContext.Provider>;
};

export const usePlatformShell = () => {
  const ctx = useContext(PlatformShellContext);
  if (!ctx) throw new Error("usePlatformShell must be used under PlatformShellProvider");
  return ctx;
};
