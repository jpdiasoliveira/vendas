import { SettingsPreviewLinkHint } from "@/react-app/components/admin/settings/fields/SettingsPreviewLinkHint";
import { SettingsSectionCard } from "@/react-app/components/admin/settings/fields/SettingsSectionCard";
import { SettingsHideableTextarea } from "@/react-app/components/admin/settings/fields/SettingsHideableTextarea";

export function SettingsLegalTab() {
  return (
    <SettingsSectionCard
      title="Textos legais e institucionais"
      description="Exibidos no rodapé quando preenchidos. Revise com assessoria jurídica se necessário."
    >
      <SettingsPreviewLinkHint section="footerPolicies" />
      <SettingsHideableTextarea
        textName="publicProfile.deliveryPolicy"
        hiddenName="publicProfile.deliveryPolicyHidden"
        id="footerDeliveryPolicy"
        label="Política de entrega"
        previewSection="footerPolicyDelivery"
      />
      <SettingsHideableTextarea
        textName="publicProfile.returnsPolicy"
        hiddenName="publicProfile.returnsPolicyHidden"
        id="footerReturnsPolicy"
        label="Trocas e devoluções"
        previewSection="footerPolicyReturns"
      />
      <SettingsHideableTextarea
        textName="publicProfile.privacyPolicy"
        hiddenName="publicProfile.privacyPolicyHidden"
        id="footerPrivacyPolicy"
        label="Privacidade / LGPD"
        previewSection="footerPolicyPrivacy"
      />
    </SettingsSectionCard>
  );
}
