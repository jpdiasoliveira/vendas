import { Controller, type FieldPath, useFormContext } from "react-hook-form";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";
import type { StorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";
import { useSettingsPreviewFieldProps } from "@/react-app/components/admin/settings/fields/useSettingsPreviewFieldProps";
import { formatBrazilPhoneInput } from "@/react-app/utils/phoneBr";

type SettingsPhoneFieldProps = {
  name: FieldPath<AdminSettingsFormValues>;
  label: string;
  placeholder?: string;
  id?: string;
  previewSection?: StorefrontPreviewSectionId;
};

export function SettingsPhoneField({
  name,
  label,
  placeholder,
  id,
  previewSection,
}: SettingsPhoneFieldProps) {
  const {
    control,
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
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <input
            id={id ?? name}
            type="text"
            inputMode="tel"
            autoComplete="tel"
            placeholder={placeholder}
            className={storefrontInputClass}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={(e) => field.onChange(formatBrazilPhoneInput(e.target.value))}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
            {...preview}
          />
        )}
      />
      {message ? <p className="mt-1 text-sm text-red-300">{message}</p> : null}
    </div>
  );
}
