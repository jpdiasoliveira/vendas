import { ImagePlus } from "lucide-react";
import { type FieldPath, useFormContext } from "react-hook-form";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";
import type { StorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";
import { useSettingsPreviewFieldProps } from "@/react-app/components/admin/settings/fields/useSettingsPreviewFieldProps";
import type { AdminProfileImageField } from "@/react-app/hooks/admin/settings/adminSettingsProfileImages";
import type { useAdminSettingsMedia } from "@/react-app/hooks/admin/settings/useAdminSettingsMedia";

type SettingsImageUrlFieldProps = {
  name: FieldPath<AdminSettingsFormValues>;
  field: AdminProfileImageField;
  label: string;
  hint?: string;
  previewSection: StorefrontPreviewSectionId;
  media: ReturnType<typeof useAdminSettingsMedia>;
};

export function SettingsImageUrlField({
  name,
  field,
  label,
  hint,
  previewSection,
  media,
}: SettingsImageUrlFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<AdminSettingsFormValues>();
  const preview = useSettingsPreviewFieldProps(previewSection);
  const fieldError = errors[name as keyof typeof errors];
  const message = fieldError?.message as string | undefined;
  const hasPendingFile = !!media.profileImageFiles[field];

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-content-muted" htmlFor={`admin-form-url-${field}`}>
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          id={`admin-form-url-${field}`}
          type="url"
          placeholder="https://…"
          className={`${storefrontInputClass} min-w-0 sm:flex-1`}
          {...register(name)}
          {...preview}
        />
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand-primary/25 bg-surface-elevated px-4 py-2.5 text-sm font-medium text-content-muted transition-colors hover:border-brand-primary/40 hover:bg-surface-muted sm:w-auto sm:shrink-0">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={media.handleProfileImageFile(field)}
          />
          <ImagePlus className="h-5 w-5 shrink-0 text-brand-primary" />
          Importar imagem
        </label>
      </div>
      <p className="mt-1 text-xs text-content-muted">
        {hasPendingFile ? "Nova imagem enquadrada — será publicada ao salvar. " : ""}
        {hint ??
          "Cole um URL ou importe um ficheiro — ao importar, ajuste zoom e posição. A imagem é publicada ao salvar."}
      </p>
      {message ? <p className="mt-1 text-sm text-red-300">{message}</p> : null}
    </div>
  );
}
