import { SettingsPreviewLinkHint } from "@/react-app/components/admin/settings/fields/SettingsPreviewLinkHint";
import { SettingsSectionCard } from "@/react-app/components/admin/settings/fields/SettingsSectionCard";
import { SettingsTextField } from "@/react-app/components/admin/settings/fields/SettingsTextField";

export function SettingsBenefitsTab() {
  return (
    <SettingsSectionCard title="Faixa verde — três benefícios">
      <SettingsPreviewLinkHint section="benefits" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsTextField name="publicProfile.benefit1Title" id="benefit1Title" label="Benefício 1 — título" previewSection="benefits" />
        <SettingsTextField name="publicProfile.benefit1Text" label="Benefício 1 — texto" previewSection="benefits" />
        <SettingsTextField name="publicProfile.benefit2Title" label="Benefício 2 — título" previewSection="benefits" />
        <SettingsTextField name="publicProfile.benefit2Text" label="Benefício 2 — texto" previewSection="benefits" />
        <SettingsTextField name="publicProfile.benefit3Title" label="Benefício 3 — título" previewSection="benefits" />
        <SettingsTextField name="publicProfile.benefit3Text" label="Benefício 3 — texto" previewSection="benefits" />
      </div>
    </SettingsSectionCard>
  );
}
