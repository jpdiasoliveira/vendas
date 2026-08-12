import { SettingsPreviewLinkHint } from "@/react-app/components/admin/settings/fields/SettingsPreviewLinkHint";
import { SettingsSectionCard } from "@/react-app/components/admin/settings/fields/SettingsSectionCard";
import { SettingsTextField } from "@/react-app/components/admin/settings/fields/SettingsTextField";

export function SettingsNewsletterTab() {
  return (
    <SettingsSectionCard title="Newsletter">
      <SettingsPreviewLinkHint section="newsletter" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsTextField
          name="publicProfile.newsletterEyebrow"
          id="newsletterEyebrow"
          label="Selo"
          previewSection="newsletter"
        />
        <SettingsTextField name="publicProfile.newsletterTitle" label="Título" previewSection="newsletter" />
      </div>
      <SettingsTextField name="publicProfile.newsletterSubtitle" label="Subtítulo" previewSection="newsletter" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsTextField
          name="publicProfile.newsletterPlaceholder"
          label="Placeholder do e-mail"
          previewSection="newsletter"
        />
        <SettingsTextField name="publicProfile.newsletterCtaLabel" label="Texto do botão" previewSection="newsletter" />
      </div>
    </SettingsSectionCard>
  );
}
