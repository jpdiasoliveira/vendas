import { SettingsPreviewLinkHint } from "@/react-app/components/admin/settings/fields/SettingsPreviewLinkHint";
import { SettingsSectionCard } from "@/react-app/components/admin/settings/fields/SettingsSectionCard";
import { SettingsHideableTextarea } from "@/react-app/components/admin/settings/fields/SettingsHideableTextarea";

export function SettingsDeliveryTab() {
  return (
    <SettingsSectionCard
      title="Entrega e atendimento"
      description="Horário da loja e informações de frete no rodapé."
    >
      <SettingsPreviewLinkHint section="footerIntro" />
      <SettingsHideableTextarea
        textName="publicProfile.businessHours"
        hiddenName="publicProfile.businessHoursHidden"
        id="footerBusinessHours"
        label="Horário de atendimento / loja"
        placeholder="Ex.: Seg a Sex 9h–18h"
        previewSection="footerIntro"
        rows={3}
      />
      <SettingsHideableTextarea
        textName="publicProfile.shippingInfo"
        hiddenName="publicProfile.shippingInfoHidden"
        label="Regiões / frete / prazos"
        placeholder="Onde entregamos, valores de frete se houver, prazo médio..."
        hiddenLabel="Ocultar na loja, incluindo o texto padrão do rodapé (mantém o que escreveu)"
        previewSection="footerIntro"
      />
    </SettingsSectionCard>
  );
}
