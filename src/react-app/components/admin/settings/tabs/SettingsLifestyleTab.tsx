import { useFormContext } from "react-hook-form";
import { lifestyleTitleFromStore } from "@/react-app/constants/storefrontHomeCopy";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";
import type { useAdminSettingsMedia } from "@/react-app/hooks/admin/settings/useAdminSettingsMedia";
import { SettingsPreviewLinkHint } from "@/react-app/components/admin/settings/fields/SettingsPreviewLinkHint";
import { SettingsSectionCard } from "@/react-app/components/admin/settings/fields/SettingsSectionCard";
import { SettingsTextField } from "@/react-app/components/admin/settings/fields/SettingsTextField";
import { SettingsLifestyleCardFields } from "@/react-app/components/admin/settings/tabs/SettingsLifestyleCardFields";

type SettingsLifestyleTabProps = {
  media: ReturnType<typeof useAdminSettingsMedia>;
};

export function SettingsLifestyleTab({ media }: SettingsLifestyleTabProps) {
  const { watch } = useFormContext<AdminSettingsFormValues>();
  const storeName = watch("displayName")?.trim() || "Sua Loja";
  const defaultTitle = lifestyleTitleFromStore(storeName);

  return (
    <SettingsSectionCard
      title="Momentos / estilo de vida"
      description="Cabeçalho da secção e dois cartões com foto e textos."
    >
      <SettingsPreviewLinkHint section="lifestyleHead" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsTextField
          name="publicProfile.lifestyleEyebrow"
          id="lifestyleEyebrow"
          label="Selo"
          placeholder="Estilo de Vida"
          previewSection="lifestyleHead"
        />
        <SettingsTextField
          name="publicProfile.lifestyleTitle"
          label="Título principal"
          placeholder={defaultTitle}
          hint={`Vazio = «${defaultTitle}».`}
          previewSection="lifestyleHead"
        />
      </div>
      <SettingsTextField
        name="publicProfile.lifestyleSubtitle"
        label="Subtítulo abaixo do título"
        previewSection="lifestyleHead"
      />

      <SettingsLifestyleCardFields
        side="left"
        media={media}
        imageField="lifestyleLeftImageUrl"
        titleName="publicProfile.lifestyleLeftTitle"
        textName="publicProfile.lifestyleLeftText"
      />
      <SettingsLifestyleCardFields
        side="right"
        media={media}
        imageField="lifestyleRightImageUrl"
        titleName="publicProfile.lifestyleRightTitle"
        textName="publicProfile.lifestyleRightText"
      />
    </SettingsSectionCard>
  );
}
