import { SettingsTextField } from "@/react-app/components/admin/settings/fields/SettingsTextField";

export function SettingsBrandingTab() {
  return (
    <div className="space-y-4">
      <SettingsTextField
        name="displayName"
        id="displayName"
        label="Nome da loja"
        placeholder="Ex.: Sua Loja"
        previewSection="navbar"
      />
      <SettingsTextField
        name="publicProfile.tagline"
        id="storeTagline"
        label="Slogan / subtítulo"
        placeholder="Opcional — aparece abaixo do nome na barra e no rodapé"
        hint="Se ficar vazio, a linha extra não é exibida."
        previewSection="navbar"
      />
    </div>
  );
}
