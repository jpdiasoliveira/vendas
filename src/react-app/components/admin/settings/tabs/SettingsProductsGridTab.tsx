import {
  DEFAULT_PRODUCTS_GRID_EYEBROW,
  DEFAULT_PRODUCTS_GRID_SUBTITLE,
  DEFAULT_PRODUCTS_GRID_TITLE,
} from "@/react-app/constants/storefrontHomeCopy";
import { SettingsPreviewLinkHint } from "@/react-app/components/admin/settings/fields/SettingsPreviewLinkHint";
import { SettingsSectionCard } from "@/react-app/components/admin/settings/fields/SettingsSectionCard";
import { SettingsTextField } from "@/react-app/components/admin/settings/fields/SettingsTextField";
import { SettingsTextareaField } from "@/react-app/components/admin/settings/fields/SettingsTextareaField";

export function SettingsProductsGridTab() {
  return (
    <SettingsSectionCard
      title="Grelha de produtos"
      description="Textos acima da listagem de produtos na home."
    >
      <SettingsPreviewLinkHint section="products" />
      <SettingsTextField
        name="publicProfile.productsGridEyebrow"
        id="productsGridEyebrow"
        label="Selo (linha pequena)"
        placeholder={DEFAULT_PRODUCTS_GRID_EYEBROW}
        previewSection="products"
      />
      <SettingsTextField
        name="publicProfile.productsGridTitle"
        label="Título da secção"
        placeholder={DEFAULT_PRODUCTS_GRID_TITLE}
        previewSection="products"
      />
      <SettingsTextareaField
        name="publicProfile.productsGridSubtitle"
        label="Subtítulo"
        placeholder={DEFAULT_PRODUCTS_GRID_SUBTITLE}
        previewSection="products"
      />
    </SettingsSectionCard>
  );
}
