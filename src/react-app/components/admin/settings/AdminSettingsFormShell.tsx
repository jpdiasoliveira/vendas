import { Loader2, Save } from "lucide-react";
import { AdminSettingsTabs, type AdminSettingsTabId } from "@/react-app/components/admin/settings/AdminSettingsTabs";
import { SettingsBrandingTab } from "@/react-app/components/admin/settings/tabs/SettingsBrandingTab";
import { SettingsThemeTab } from "@/react-app/components/admin/settings/tabs/SettingsThemeTab";
import { SettingsHeroTab } from "@/react-app/components/admin/settings/tabs/SettingsHeroTab";
import { SettingsProductsGridTab } from "@/react-app/components/admin/settings/tabs/SettingsProductsGridTab";
import { SettingsStoryTab } from "@/react-app/components/admin/settings/tabs/SettingsStoryTab";
import { SettingsLifestyleTab } from "@/react-app/components/admin/settings/tabs/SettingsLifestyleTab";
import { SettingsBenefitsTab } from "@/react-app/components/admin/settings/tabs/SettingsBenefitsTab";
import { SettingsNewsletterTab } from "@/react-app/components/admin/settings/tabs/SettingsNewsletterTab";
import { SettingsContactTab } from "@/react-app/components/admin/settings/tabs/SettingsContactTab";
import { SettingsDeliveryTab } from "@/react-app/components/admin/settings/tabs/SettingsDeliveryTab";
import { SettingsLegalTab } from "@/react-app/components/admin/settings/tabs/SettingsLegalTab";
import type { useAdminSettingsMedia } from "@/react-app/hooks/admin/settings/useAdminSettingsMedia";

type AdminSettingsFormShellProps = {
  activeTab: AdminSettingsTabId;
  onTabChange: (tab: AdminSettingsTabId) => void;
  saving: boolean;
  media: ReturnType<typeof useAdminSettingsMedia>;
  logoTab: React.ReactNode;
};

export function AdminSettingsFormShell({
  activeTab,
  onTabChange,
  saving,
  media,
  logoTab,
}: AdminSettingsFormShellProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-brand-primary/10 bg-surface-elevated p-4 sm:p-5">
      <AdminSettingsTabs active={activeTab} onChange={onTabChange} />
      <div className="mt-6 space-y-6">
        {activeTab === "branding" ? <SettingsBrandingTab /> : null}
        {activeTab === "logo" ? logoTab : null}
        {activeTab === "theme" ? <SettingsThemeTab /> : null}
        {activeTab === "hero" ? <SettingsHeroTab media={media} /> : null}
        {activeTab === "products" ? <SettingsProductsGridTab /> : null}
        {activeTab === "story" ? <SettingsStoryTab media={media} /> : null}
        {activeTab === "lifestyle" ? <SettingsLifestyleTab media={media} /> : null}
        {activeTab === "benefits" ? <SettingsBenefitsTab /> : null}
        {activeTab === "newsletter" ? <SettingsNewsletterTab /> : null}
        {activeTab === "contact" ? <SettingsContactTab /> : null}
        {activeTab === "delivery" ? <SettingsDeliveryTab /> : null}
        {activeTab === "legal" ? <SettingsLegalTab /> : null}
      </div>
      <button
        type="submit"
        disabled={saving}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary py-3.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        {saving ? "Salvando..." : "Salvar configurações"}
      </button>
    </div>
  );
}
