import { useFormContext } from "react-hook-form";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";
import type { useAdminSettingsMedia } from "@/react-app/hooks/admin/settings/useAdminSettingsMedia";
import {
  DEFAULT_HERO_BADGE,
  DEFAULT_HERO_CTA,
  DEFAULT_HERO_SUBTITLE,
  DEFAULT_HERO_TITLE,
} from "@/react-app/constants/storefrontHomeCopy";
import { SettingsPreviewLinkHint } from "@/react-app/components/admin/settings/fields/SettingsPreviewLinkHint";
import { SettingsSectionCard } from "@/react-app/components/admin/settings/fields/SettingsSectionCard";
import { SettingsTextField } from "@/react-app/components/admin/settings/fields/SettingsTextField";
import { SettingsTextareaField } from "@/react-app/components/admin/settings/fields/SettingsTextareaField";
import { SettingsBannerUploadFields } from "@/react-app/components/admin/settings/hero/SettingsBannerUploadFields";

type SettingsHeroTabProps = {
  media: ReturnType<typeof useAdminSettingsMedia>;
};

export function SettingsHeroTab({ media }: SettingsHeroTabProps) {
  const { watch } = useFormContext<AdminSettingsFormValues>();
  const bannerUrl = watch("bannerUrl") ?? "";
  const bannerSrc = (media.bannerPreview ?? bannerUrl).trim();

  return (
    <SettingsSectionCard
      title="Hero / Banner"
      description="Imagem de fundo e textos do topo da página inicial."
    >
      <SettingsPreviewLinkHint section="hero" />
      <div className="rounded-2xl border border-brand-primary/10 bg-surface-muted/30 p-4">
        <SettingsBannerUploadFields
          onPickFile={media.handleBannerFile}
          hasPendingFile={!!media.bannerFile}
        />
        {bannerSrc ? (
          <img
            src={bannerSrc}
            alt=""
            className="mt-4 aspect-[21/9] w-full rounded-xl border border-brand-primary/10 object-cover"
          />
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsTextField
          name="publicProfile.heroBadge"
          id="heroBadge"
          label="Selo (linha pequena)"
          placeholder={DEFAULT_HERO_BADGE}
          previewSection="hero"
        />
        <SettingsTextField
          name="publicProfile.heroCtaLabel"
          label="Texto do botão"
          placeholder={DEFAULT_HERO_CTA}
          previewSection="hero"
        />
      </div>
      <SettingsTextField
        name="publicProfile.heroTitle"
        label="Título principal"
        placeholder={DEFAULT_HERO_TITLE}
        previewSection="hero"
      />
      <SettingsTextareaField
        name="publicProfile.heroSubtitle"
        label="Subtítulo"
        placeholder={DEFAULT_HERO_SUBTITLE}
        previewSection="hero"
      />
    </SettingsSectionCard>
  );
}
