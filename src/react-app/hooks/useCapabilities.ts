import { useMemo } from "react";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import type { StoreCapabilities } from "@/react-app/types";

const DEFAULT_CAPABILITIES: StoreCapabilities = {
  maxProducts: null,
  staffMembersLimit: null,
  customDomain: false,
  advancedAnalytics: false,
  hasActiveSubscription: false,
};

/**
 * Mapa de direitos da loja (vem de GET /api/store/settings → `capabilities`).
 * Use `isAtProductLimit` com a contagem atual de produtos do painel.
 */
export const useCapabilities = () => {
  const { settings, loading } = useStoreSettings();

  const capabilities = useMemo(
    () => settings?.capabilities ?? DEFAULT_CAPABILITIES,
    [settings?.capabilities]
  );

  const isAtProductLimit = (currentProductCount: number) =>
    capabilities.maxProducts != null && currentProductCount >= capabilities.maxProducts;

  return { capabilities, loading, isAtProductLimit };
};
