import { useFormContext } from "react-hook-form";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";
import type { useAdminSettingsMedia } from "@/react-app/hooks/admin/settings/useAdminSettingsMedia";
import { SettingsLogoUploadFields } from "@/react-app/components/admin/settings/logo/SettingsLogoUploadFields";
import { SettingsLogoPreviewCard } from "@/react-app/components/admin/settings/logo/SettingsLogoPreviewCard";
import { SettingsLogoPalettePanel } from "@/react-app/components/admin/settings/logo/SettingsLogoPalettePanel";
import { SettingsLogoOptionsFields } from "@/react-app/components/admin/settings/logo/SettingsLogoOptionsFields";

type SettingsLogoTabProps = {
  media: ReturnType<typeof useAdminSettingsMedia>;
};

export function SettingsLogoTab({ media }: SettingsLogoTabProps) {
  const { watch } = useFormContext<AdminSettingsFormValues>();
  const logoUrl = watch("logoUrl") ?? "";
  const logoSrc = (media.logoPreview ?? logoUrl).trim();
  const knockout = watch("publicProfile.logoKnockoutWhite") === true;
  const logoHeightPx = watch("publicProfile.logoHeightPx") ?? 40;

  return (
    <div className="space-y-4">
      <p className="text-xs text-content-muted">
        Envie um arquivo ou informe a URL. Ao enviar ficheiro, pode ajustar zoom e posição no passo seguinte.
      </p>
      <div className="rounded-2xl border border-brand-primary/10 bg-surface-muted/30 p-4">
        <div className="grid gap-5 lg:grid-cols-2">
          <SettingsLogoUploadFields onPickFile={media.handleLogoFile} />
          <SettingsLogoPreviewCard
            src={logoSrc}
            previewFailed={media.logoPreviewFailed}
            knockout={knockout}
            logoHeightPx={logoHeightPx}
            onPreviewError={() => media.setLogoPreviewFailed(true)}
          />
        </div>
      </div>
      <SettingsLogoPalettePanel logoSrc={logoSrc} previewFailed={media.logoPreviewFailed} />
      <SettingsLogoOptionsFields />
    </div>
  );
}
