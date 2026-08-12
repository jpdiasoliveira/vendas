import { useMemo, type CSSProperties } from "react";
import { useFormContext } from "react-hook-form";
import { AdminStorefrontPreviewChrome } from "@/react-app/components/admin/AdminStorefrontPreviewChrome";
import { AdminStorefrontPreviewPanel } from "@/react-app/components/admin/AdminStorefrontPreviewPanel";
import {
  formFieldIdForPreviewSection,
  scrollAdminFormToFieldId,
  type StorefrontPreviewSectionId,
} from "@/react-app/components/admin/storefrontPreviewLink";
import type { StoreSettings } from "@/contracts/schema";
import type { AdminSettingsFormValues } from "@/schemas/adminSettingsForm";
import { parseBRL } from "@/react-app/utils/adminSettingsBrl";
import { normalizeStoreAccentColor, normalizeStorePrimaryColor } from "@/react-app/utils/brandColor";
import type { useAdminSettingsMedia } from "@/react-app/hooks/admin/settings/useAdminSettingsMedia";
import type { useStorefrontPreviewFocus } from "@/react-app/components/admin/useStorefrontPreviewFocus";

type AdminSettingsPreviewAsideProps = {
  media: ReturnType<typeof useAdminSettingsMedia>;
  preview: ReturnType<typeof useStorefrontPreviewFocus>;
};

export function AdminSettingsPreviewAside({ media, preview }: AdminSettingsPreviewAsideProps) {
  const { watch } = useFormContext<AdminSettingsFormValues>();
  const values = watch();
  const { activeSection, previewScrollTick, previewMarkSection } = preview;

  const previewMerge = useMemo<Partial<StoreSettings>>(() => {
    const profile = values.publicProfile;
    return {
      displayName: values.displayName.trim() || "Sua Loja",
      logoUrl: (media.logoPreview ?? values.logoUrl ?? "").trim() || null,
      bannerUrl: (media.bannerPreview ?? values.bannerUrl ?? "").trim() || null,
      primaryColor: values.primaryColor || null,
      minimumOrderValue: parseBRL(values.minimumOrderValue),
      publicProfile: {
        ...profile,
        storyImageUrl: media.getProfileImagePreview("storyImageUrl", profile.storyImageUrl ?? ""),
        lifestyleLeftImageUrl: media.getProfileImagePreview(
          "lifestyleLeftImageUrl",
          profile.lifestyleLeftImageUrl ?? "",
        ),
        lifestyleRightImageUrl: media.getProfileImagePreview(
          "lifestyleRightImageUrl",
          profile.lifestyleRightImageUrl ?? "",
        ),
      },
    };
  }, [values, media.logoPreview, media.bannerPreview, media.profileImagePreviews]);

  const onPreviewNavigate = (section: StorefrontPreviewSectionId) => {
    previewMarkSection(section);
    scrollAdminFormToFieldId(formFieldIdForPreviewSection(section));
  };

  const style = {
    ["--brand-primary"]: normalizeStorePrimaryColor(values.primaryColor),
    ["--brand-accent"]: normalizeStoreAccentColor(values.publicProfile.accentColor ?? undefined),
  } as CSSProperties;

  return (
    <aside
      className="mt-10 flex min-h-[min(42dvh,22rem)] min-w-0 flex-col border-t border-brand-primary/10 pt-8 lg:sticky lg:top-[4.75rem] lg:z-30 lg:mt-0 lg:h-[calc(100vh-32px)] lg:min-h-0 lg:self-start lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0"
      role="complementary"
      aria-label="Pré-visualização da vitrine"
      style={style}
    >
      <AdminStorefrontPreviewChrome activeSection={activeSection} />
      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        <AdminStorefrontPreviewPanel
          merge={previewMerge}
          activeSection={activeSection}
          previewScrollTick={previewScrollTick}
          onPreviewNavigate={onPreviewNavigate}
        />
      </div>
    </aside>
  );
}
