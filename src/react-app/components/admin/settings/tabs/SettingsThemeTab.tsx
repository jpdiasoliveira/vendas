import { SettingsColorField } from "@/react-app/components/admin/settings/fields/SettingsColorField";

export function SettingsThemeTab() {
  return (
    <div className="space-y-6">
      <SettingsColorField
        label="Cor primária"
        colorName="primaryColor"
        placeholder="#RRGGBB"
        hint="Marca, textos e sobreposições na vitrine."
        previewSection="hero"
      />
      <SettingsColorField
        label="Cor dos botões (gradiente)"
        colorName="publicProfile.accentColor"
        placeholder="#RRGGBB (opcional)"
        hint="Segundo tom do gradiente em CTAs. Vazio = tom padrão da loja."
        previewSection="hero"
      />
    </div>
  );
}
