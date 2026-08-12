import { useFormContext } from "react-hook-form";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";
import type { useAdminSettingsMedia } from "@/react-app/hooks/admin/settings/useAdminSettingsMedia";
import { SettingsPreviewLinkHint } from "@/react-app/components/admin/settings/fields/SettingsPreviewLinkHint";
import { SettingsSectionCard } from "@/react-app/components/admin/settings/fields/SettingsSectionCard";
import { SettingsTextField } from "@/react-app/components/admin/settings/fields/SettingsTextField";
import { SettingsTextareaField } from "@/react-app/components/admin/settings/fields/SettingsTextareaField";
import { SettingsImageUrlField } from "@/react-app/components/admin/settings/fields/SettingsImageUrlField";

type SettingsStoryTabProps = {
  media: ReturnType<typeof useAdminSettingsMedia>;
};

export function SettingsStoryTab({ media }: SettingsStoryTabProps) {
  const { watch } = useFormContext<AdminSettingsFormValues>();
  const storeName = watch("displayName")?.trim() || "Sua Loja";

  return (
    <SettingsSectionCard
      title="Nossa história"
      description="Texto e imagem da secção abaixo do hero."
    >
      <SettingsPreviewLinkHint section="story" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsTextField
          name="publicProfile.storyEyebrow"
          id="storyEyebrow"
          label="Selo (linha pequena)"
          placeholder="Ex.: Nossa Jornada"
          previewSection="story"
        />
        <SettingsTextField
          name="publicProfile.storyHeading"
          label="Título da secção"
          placeholder="Nossa História"
          previewSection="story"
        />
      </div>
      <SettingsTextareaField
        name="publicProfile.storyBody"
        label="Texto (parágrafos)"
        placeholder={"Um parágrafo por bloco — separe com linha em branco.\n\nEx.: primeiro parágrafo...\n\nSegundo parágrafo..."}
        hint={`Vazio = três parágrafos padrão (incluem o nome «${storeName}» no primeiro).`}
        previewSection="story"
      />
      <SettingsImageUrlField
        name="publicProfile.storyImageUrl"
        field="storyImageUrl"
        label="URL da foto grande (lado direito)"
        previewSection="story"
        media={media}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsTextField
          name="publicProfile.storyChip1"
          label="Chip 1 (ícone folha)"
          previewSection="story"
        />
        <SettingsTextField
          name="publicProfile.storyChip2"
          label="Chip 2 (ícone local)"
          previewSection="story"
        />
      </div>
    </SettingsSectionCard>
  );
}
