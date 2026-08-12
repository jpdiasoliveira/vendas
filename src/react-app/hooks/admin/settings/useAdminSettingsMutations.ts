import { useMutation, useQueryClient } from "@tanstack/react-query";

import { adminApiFetch, adminUploadImage } from "@/react-app/services/api";

import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";

import { useToast } from "@/react-app/providers/ToastProvider";

import type { AdminProfileImageField } from "@/react-app/hooks/admin/settings/adminSettingsProfileImages";

import { formValuesToPatchPayload, type AdminSettingsFormValues } from "@/schemas/adminSettingsForm";



type SaveSettingsInput = {

  values: AdminSettingsFormValues;

  logoFile: File | null;

  bannerFile: File | null;

  profileImageFiles: Partial<Record<AdminProfileImageField, File>>;

};



async function uploadProfileImages(

  values: AdminSettingsFormValues,

  profileImageFiles: Partial<Record<AdminProfileImageField, File>>,

) {

  const publicProfile = { ...values.publicProfile };

  for (const [field, file] of Object.entries(profileImageFiles) as [AdminProfileImageField, File][]) {

    if (!file) continue;

    const { publicUrl } = await adminUploadImage(file);

    publicProfile[field] = publicUrl;

  }

  return publicProfile;

}



export function useAdminSettingsMutations() {

  const queryClient = useQueryClient();

  const { refetch: refetchStoreSettings } = useStoreSettings();

  const { showToast } = useToast();



  const saveMutation = useMutation({

    mutationFn: async ({ values, logoFile, bannerFile, profileImageFiles }: SaveSettingsInput) => {

      let logoUrlFinal = values.logoUrl?.trim() ?? "";

      if (logoFile) {

        const { publicUrl } = await adminUploadImage(logoFile);

        logoUrlFinal = publicUrl;

      }

      let bannerUrlFinal = values.bannerUrl?.trim() ?? "";

      if (bannerFile) {

        const { publicUrl } = await adminUploadImage(bannerFile);

        bannerUrlFinal = publicUrl;

      }

      const publicProfile = await uploadProfileImages(values, profileImageFiles);

      const body = formValuesToPatchPayload({ ...values, publicProfile }, logoUrlFinal, bannerUrlFinal);

      await adminApiFetch("/api/admin/settings", {

        method: "PATCH",

        body: JSON.stringify(body),

      });

      return { logoUrl: logoUrlFinal, bannerUrl: bannerUrlFinal, publicProfile };

    },

    onSuccess: async () => {

      showToast({ type: "success", message: "Configurações salvas com sucesso." });

      void queryClient.invalidateQueries({ queryKey: ["admin", "store-settings-form"] });

      await refetchStoreSettings({ silent: true });

    },

    onError: (err: unknown) => {

      showToast({

        type: "error",

        message: err instanceof Error ? err.message : "Erro ao salvar configurações.",

      });

    },

  });



  return { saveMutation };

}

