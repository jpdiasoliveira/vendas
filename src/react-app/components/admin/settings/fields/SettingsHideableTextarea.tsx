import { EyeOff } from "lucide-react";
import { type FieldPath, useFormContext } from "react-hook-form";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";
import type { StorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";
import { useSettingsPreviewFieldProps } from "@/react-app/components/admin/settings/fields/useSettingsPreviewFieldProps";

type SettingsHideableTextareaProps = {
  textName: FieldPath<AdminSettingsFormValues>;
  hiddenName: FieldPath<AdminSettingsFormValues>;
  label: string;
  hiddenLabel?: string;
  placeholder?: string;
  id?: string;
  previewSection?: StorefrontPreviewSectionId;
  rows?: number;
};

export function SettingsHideableTextarea({
  textName,
  hiddenName,
  label,
  hiddenLabel = "Ocultar na loja (mantém o texto guardado)",
  placeholder,
  id,
  previewSection,
  rows = 4,
}: SettingsHideableTextareaProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<AdminSettingsFormValues>();
  const preview = useSettingsPreviewFieldProps(previewSection);
  const hidden = watch(hiddenName) === true;
  const textError = errors[textName as keyof typeof errors];
  const message = textError?.message as string | undefined;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-content-muted" htmlFor={id ?? textName}>
        {label}
      </label>
      <textarea
        id={id ?? textName}
        rows={rows}
        placeholder={placeholder}
        className={`${storefrontInputClass} min-h-[100px] resize-y ${hidden ? "opacity-60" : ""}`}
        {...register(textName)}
        {...preview}
      />
      <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-content-muted">
        <input
          type="checkbox"
          className="h-4 w-4 shrink-0 rounded border-brand-primary/30 text-brand-primary focus:ring-brand-primary/30"
          {...register(hiddenName)}
        />
        <EyeOff className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        <span>{hiddenLabel}</span>
      </label>
      {message ? <p className="mt-1 text-sm text-red-300">{message}</p> : null}
    </div>
  );
}
