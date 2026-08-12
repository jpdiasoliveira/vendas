import { createContext, useContext, type ReactNode } from "react";
import type { StorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";

type SettingsPreviewContextValue = {
  previewFocus: (id: StorefrontPreviewSectionId) => void;
  previewBlur: () => void;
};

const SettingsPreviewContext = createContext<SettingsPreviewContextValue | null>(null);

export function SettingsPreviewProvider({
  children,
  previewFocus,
  previewBlur,
}: SettingsPreviewContextValue & { children: ReactNode }) {
  return (
    <SettingsPreviewContext.Provider value={{ previewFocus, previewBlur }}>
      {children}
    </SettingsPreviewContext.Provider>
  );
}

export function useSettingsPreviewContext() {
  const ctx = useContext(SettingsPreviewContext);
  if (!ctx) throw new Error("useSettingsPreviewContext deve ser usado dentro de SettingsPreviewProvider");
  return ctx;
}
