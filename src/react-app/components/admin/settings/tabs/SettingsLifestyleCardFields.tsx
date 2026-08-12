import type { FieldPath } from "react-hook-form";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";
import type { AdminProfileImageField } from "@/react-app/hooks/admin/settings/adminSettingsProfileImages";
import type { useAdminSettingsMedia } from "@/react-app/hooks/admin/settings/useAdminSettingsMedia";
import { SettingsPreviewLinkHint } from "@/react-app/components/admin/settings/fields/SettingsPreviewLinkHint";
import { SettingsTextField } from "@/react-app/components/admin/settings/fields/SettingsTextField";
import { SettingsImageUrlField } from "@/react-app/components/admin/settings/fields/SettingsImageUrlField";

type SettingsLifestyleCardFieldsProps = {
  side: "left" | "right";
  media: ReturnType<typeof useAdminSettingsMedia>;
  imageField: AdminProfileImageField;
  titleName: FieldPath<AdminSettingsFormValues>;
  textName: FieldPath<AdminSettingsFormValues>;
};

export function SettingsLifestyleCardFields({
  side,
  media,
  imageField,
  titleName,
  textName,
}: SettingsLifestyleCardFieldsProps) {
  const previewSection = side === "left" ? "lifestyleLeft" : "lifestyleRight";
  const label = side === "left" ? "Cartão da esquerda" : "Cartão da direita";

  return (
    <div className="space-y-4 border-t border-brand-primary/10 pt-4">
      <p className="text-xs font-medium text-content">{label}</p>
      <SettingsPreviewLinkHint section={previewSection} />
      <SettingsImageUrlField
        name={`publicProfile.${imageField}`}
        field={imageField}
        label="URL da foto"
        previewSection={previewSection}
        media={media}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsTextField
          name={titleName}
          label="Título sobre a foto"
          hint="Vazio = sem título sobre a foto."
          previewSection={previewSection}
        />
        <SettingsTextField
          name={textName}
          label="Texto sobre a foto"
          hint="Vazio = sem essa linha sobre a foto."
          previewSection={previewSection}
        />
      </div>
    </div>
  );
}
