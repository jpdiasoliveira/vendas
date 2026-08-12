import { useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { LayoutDashboard } from "lucide-react";
import { useStorefrontPreviewFocus } from "@/react-app/components/admin/useStorefrontPreviewFocus";
import { SettingsPreviewProvider } from "@/react-app/components/admin/settings/SettingsPreviewContext";
import { AdminSettingsFormShell } from "@/react-app/components/admin/settings/AdminSettingsFormShell";
import { AdminSettingsPreviewAside } from "@/react-app/components/admin/settings/AdminSettingsPreviewAside";
import { SettingsLogoTab } from "@/react-app/components/admin/settings/tabs/SettingsLogoTab";
import { ImageCoverFramingDrawer } from "@/react-app/components/admin/media/ImageCoverFramingDrawer";
import { useAdminSettingsPage } from "@/react-app/hooks/admin/settings/useAdminSettingsPage";
import { useToast } from "@/react-app/providers/ToastProvider";

export function AdminSettingsPageLayout() {
  const page = useAdminSettingsPage();
  const preview = useStorefrontPreviewFocus();
  const { showToast } = useToast();

  useEffect(() => {
    if (page.loadError) showToast({ type: "error", message: page.loadError });
  }, [page.loadError, showToast]);

  if (page.loading) {
    return (
      <div className="rounded-2xl border border-brand-primary/10 bg-surface-elevated p-12 text-center">
        <p className="text-content-muted">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <SettingsPreviewProvider previewFocus={preview.previewFocus} previewBlur={preview.previewBlur}>
      <FormProvider {...page.form}>
        <form onSubmit={page.form.handleSubmit(page.handleSave)} className="w-full min-w-0">
          <div className="mb-6 flex items-center gap-3">
            <LayoutDashboard className="h-9 w-9 shrink-0 text-brand-primary sm:h-10 sm:w-10" />
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-content sm:text-4xl">Vitrine</h1>
              <p className="mt-0.5 text-sm text-content-muted">Identidade visual, tema e aparência da loja</p>
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-4">
            <AdminSettingsFormShell
              activeTab={page.activeTab}
              onTabChange={page.setActiveTab}
              saving={page.saving}
              media={page.media}
              logoTab={<SettingsLogoTab media={page.media} />}
            />
            <AdminSettingsPreviewAside media={page.media} preview={preview} />
          </div>
        </form>

        {page.media.framingSession ? (
          <ImageCoverFramingDrawer
            open
            kind={page.media.framingSession.kind}
            imageSrc={page.media.framingSession.objectUrl}
            originalFileName={page.media.framingSession.originalFileName}
            onClose={page.media.cancelFraming}
            onConfirm={async (file) => page.media.completeFraming(file)}
          />
        ) : null}
      </FormProvider>
    </SettingsPreviewProvider>
  );
}
