import { useFormContext } from "react-hook-form";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";
import type { StorefrontPreviewSectionId } from "@/react-app/components/admin/storefrontPreviewLink";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import { useSettingsPreviewFieldProps } from "@/react-app/components/admin/settings/fields/useSettingsPreviewFieldProps";

type SettingsColorFieldProps = {
  label: string;
  colorName: "primaryColor" | "publicProfile.accentColor";
  hint?: string;
  placeholder?: string;
  previewSection?: StorefrontPreviewSectionId;
};

export function SettingsColorField({
  label,
  colorName,
  hint,
  placeholder,
  previewSection,
}: SettingsColorFieldProps) {
  const { watch, setValue } = useFormContext<AdminSettingsFormValues>();
  const preview = useSettingsPreviewFieldProps(previewSection);
  const value = String(watch(colorName) ?? "");
  const pickerValue = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#000000";

  const onTextChange = (raw: string) => {
    const v = raw.trim();
    if (v === "" && colorName === "publicProfile.accentColor") {
      setValue(colorName, "", { shouldDirty: true, shouldValidate: true });
      return;
    }
    if (/^#[0-9A-Fa-f]{0,6}$/.test(v) || /^[0-9A-Fa-f]{0,6}$/.test(v)) {
      setValue(colorName, v.startsWith("#") ? v : `#${v}`, { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-content-muted">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => setValue(colorName, e.target.value, { shouldDirty: true, shouldValidate: true })}
          className="h-12 w-12 cursor-pointer rounded-lg border border-brand-primary/20 bg-surface-elevated"
          {...preview}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 font-mono text-sm ${storefrontInputClass}`}
          {...preview}
        />
      </div>
      {hint ? <p className="mt-1 text-xs text-content-muted">{hint}</p> : null}
    </div>
  );
}
