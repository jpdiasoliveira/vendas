import { SettingsPreviewLinkHint } from "@/react-app/components/admin/settings/fields/SettingsPreviewLinkHint";
import { SettingsSectionCard } from "@/react-app/components/admin/settings/fields/SettingsSectionCard";
import { SettingsPhoneField } from "@/react-app/components/admin/settings/fields/SettingsPhoneField";
import { SettingsTextField } from "@/react-app/components/admin/settings/fields/SettingsTextField";

export function SettingsContactTab() {
  return (
    <SettingsSectionCard
      title="Contato e redes"
      description="Telefones, e-mail e links exibidos no rodapé da loja."
    >
      <SettingsPreviewLinkHint section="footerContact" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsPhoneField
          name="publicProfile.contactWhatsapp"
          id="footerContactWhatsapp"
          label="Telefone / WhatsApp"
          placeholder="(47) 99999-9999 ou link wa.me"
          previewSection="footerContact"
        />
        <SettingsPhoneField
          name="publicProfile.contactPhone"
          label="Telefone fixo / outro"
          placeholder="(61) 3333-0000"
          previewSection="footerContact"
        />
        <div className="sm:col-span-2">
          <SettingsTextField
            name="publicProfile.contactEmail"
            label="E-mail de atendimento"
            placeholder="contato@sualoja.com"
            inputType="email"
            previewSection="footerContact"
          />
        </div>
        <SettingsTextField
          name="publicProfile.instagramUrl"
          label="Instagram (URL)"
          placeholder="https://instagram.com/..."
          inputType="url"
          previewSection="footerContact"
        />
        <SettingsTextField
          name="publicProfile.facebookUrl"
          label="Facebook (URL)"
          placeholder="https://facebook.com/..."
          inputType="url"
          previewSection="footerContact"
        />
      </div>
    </SettingsSectionCard>
  );
}
