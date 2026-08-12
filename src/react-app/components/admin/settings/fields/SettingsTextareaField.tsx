import { type FieldPath, useFormContext } from "react-hook-form";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";
import type { StorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";
import { useSettingsPreviewFieldProps } from "@/react-app/components/admin/settings/fields/useSettingsPreviewFieldProps";

type SettingsTextareaFieldProps = {
  name: FieldPath<AdminSettingsFormValues>;
  label: string;
  hint?: string;
  placeholder?: string;
  previewSection?: StorefrontPreviewSectionId;
  id?: string;
  rows?: number;
};

export function SettingsTextareaField({
  name,
  label,
  hint,
  placeholder,
  previewSection,
  id,
  rows = 6,
}: SettingsTextareaFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<AdminSettingsFormValues>();
  const preview = useSettingsPreviewFieldProps(previewSection);
  const fieldError = errors[name as keyof typeof errors];
  const message = fieldError?.message as string | undefined;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-content-muted" htmlFor={id ?? name}>
        {label}
      </label>
      <textarea
        id={id ?? name}
        rows={rows}
        placeholder={placeholder}
        className={`${storefrontInputClass} min-h-[120px] resize-y`}
        {...register(name)}
        {...preview}
      />
      {hint ? <p className="mt-1 text-xs text-content-muted">{hint}</p> : null}
      {message ? <p className="mt-1 text-sm text-red-300">{message}</p> : null}
    </div>
  );
}
