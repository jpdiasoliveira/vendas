import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { adminApiFetch, getEffectiveStoreSlug } from "@/react-app/services/api";
import type { StoreSettings } from "@/contracts/schema";
import { adminStoreSettingsFormQueryKey } from "@/react-app/query/queryKeys";
import { ADMIN_PANEL_GC_MS, ADMIN_PANEL_STALE_MS } from "@/react-app/query/adminPanelCache";
import { useAdminSettingsForm } from "@/react-app/hooks/admin/settings/useAdminSettingsForm";
import { useAdminSettingsMedia } from "@/react-app/hooks/admin/settings/useAdminSettingsMedia";
import { useAdminSettingsMutations } from "@/react-app/hooks/admin/settings/useAdminSettingsMutations";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";
import type { AdminSettingsTabId } from "@/react-app/components/admin/settings/AdminSettingsTabs";

export function useAdminSettingsPage() {
  const { user } = useAuth();
  const storeSlug = getEffectiveStoreSlug();
  const [activeTab, setActiveTab] = useState<AdminSettingsTabId>("branding");

  const settingsQuery = useQuery({
    queryKey: adminStoreSettingsFormQueryKey(storeSlug || "_"),
    queryFn: () => adminApiFetch<StoreSettings>("/api/admin/settings"),
    staleTime: ADMIN_PANEL_STALE_MS,
    gcTime: ADMIN_PANEL_GC_MS,
    retry: false,
    enabled: !!user,
  });

  const form = useAdminSettingsForm(settingsQuery.data);
  const media = useAdminSettingsMedia();
  const { saveMutation } = useAdminSettingsMutations();

  const loading = settingsQuery.isPending && settingsQuery.data === undefined;
  const loadError =
    settingsQuery.error instanceof Error
      ? settingsQuery.error.message
      : settingsQuery.error
        ? String(settingsQuery.error)
        : null;

  const handleSave = async (values: AdminSettingsFormValues) => {
    const result = await saveMutation.mutateAsync({
      values,
      logoFile: media.logoFile,
      bannerFile: media.bannerFile,
      profileImageFiles: media.profileImageFiles,
    });
    media.clearPendingUploads();
    form.setValue("logoUrl", result.logoUrl);
    form.setValue("bannerUrl", result.bannerUrl);
    form.setValue("publicProfile", result.publicProfile);
  };

  return {
    loading,
    loadError,
    activeTab,
    setActiveTab,
    form,
    media,
    saving: saveMutation.isPending,
    handleSave,
  };
}
