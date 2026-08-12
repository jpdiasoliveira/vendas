import { ImagePlus } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";
import { useSettingsPreviewFieldProps } from "@/react-app/components/admin/settings/fields/useSettingsPreviewFieldProps";

type SettingsLogoUploadFieldsProps = {
  onPickFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function SettingsLogoUploadFields({ onPickFile }: SettingsLogoUploadFieldsProps) {
  const { register } = useFormContext<AdminSettingsFormValues>();
  const preview = useSettingsPreviewFieldProps("navbar");

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-primary/25 bg-surface-elevated px-4 py-3.5 hover:border-brand-primary/40 hover:bg-surface-muted">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onPickFile}
          onFocus={preview.onFocus}
          onBlur={preview.onBlur}
        />
        <ImagePlus className="h-5 w-5 shrink-0 text-content-muted" />
        <span className="text-sm font-medium text-content-muted">Enviar imagem do logo</span>
      </label>
      <div>
        <label className="mb-1 block text-xs font-medium text-content-muted" htmlFor="logoUrl">
          URL da imagem (opcional se enviar arquivo)
        </label>
        <input id="logoUrl" type="url" placeholder="https://..." className={storefrontInputClass} {...register("logoUrl")} {...preview} />
      </div>
    </div>
  );
}
