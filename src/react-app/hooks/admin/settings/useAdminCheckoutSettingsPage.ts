import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import type { StoreSettings } from "@/contracts/schema";
import { adminStoreSettingsFormQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";
import { useAdminSettingsForm } from "@/react-app/hooks/admin/settings/useAdminSettingsForm";
import { useAdminSettingsMutations } from "@/react-app/hooks/admin/settings/useAdminSettingsMutations";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";

export function useAdminCheckoutSettingsPage() {
  const { user } = useAuth();
  const storeSlug = getEffectiveStoreSlug();
  const [checkoutLoginAck, setCheckoutLoginAck] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: adminStoreSettingsFormQueryKey(storeSlug || "_"),
    queryFn: () => adminApiFetch<StoreSettings>("/api/admin/settings"),
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    retry: false,
    enabled: !!user,
  });

  const form = useAdminSettingsForm(settingsQuery.data);
  const { saveMutation } = useAdminSettingsMutations();

  const loading = settingsQuery.isPending && settingsQuery.data === undefined;
  const loadError =
    settingsQuery.error instanceof Error
      ? settingsQuery.error.message
      : settingsQuery.error
        ? String(settingsQuery.error)
        : null;

  const handleSave = async (values: AdminSettingsFormValues) => {
    await saveMutation.mutateAsync({
      values,
      logoFile: null,
      bannerFile: null,
      profileImageFiles: {},
    });
    setCheckoutLoginAck(null);
  };

  return {
    loading,
    loadError,
    form,
    saving: saveMutation.isPending,
    handleSave,
    checkoutLoginAck,
    setCheckoutLoginAck,
  };
}
