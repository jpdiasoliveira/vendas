import { ImagePlus } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";
import { useSettingsPreviewFieldProps } from "@/react-app/components/admin/settings/fields/useSettingsPreviewFieldProps";

type SettingsBannerUploadFieldsProps = {
  onPickFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasPendingFile: boolean;
};

export function SettingsBannerUploadFields({ onPickFile, hasPendingFile }: SettingsBannerUploadFieldsProps) {
  const { register } = useFormContext<AdminSettingsFormValues>();
  const preview = useSettingsPreviewFieldProps("hero");

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-primary/25 bg-surface-elevated px-4 py-3.5 hover:border-brand-primary/40 hover:bg-surface-muted">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={onPickFile}
          onFocus={preview.onFocus}
          onBlur={preview.onBlur}
        />
        <ImagePlus className="h-5 w-5 shrink-0 text-content-muted" />
        <span className="text-sm font-medium text-content-muted">Enviar imagem do banner</span>
      </label>
      <div>
        <label className="mb-1 block text-xs font-medium text-content-muted" htmlFor="bannerUrl">
          URL da imagem (opcional se enviar arquivo)
        </label>
        <input
          id="bannerUrl"
          type="url"
          placeholder="https://..."
          className={storefrontInputClass}
          {...register("bannerUrl")}
          {...preview}
        />
      </div>
      <p className="text-xs text-content-muted">
        {hasPendingFile
          ? "Nova imagem enquadrada — será publicada ao salvar."
          : "Cole um URL ou importe um ficheiro — ao importar, ajuste zoom e posição."}
      </p>
    </div>
  );
}
