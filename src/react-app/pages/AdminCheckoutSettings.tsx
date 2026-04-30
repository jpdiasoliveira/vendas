import { useAdminSettings } from "@/react-app/hooks/useAdminSettings";
import { AdminCheckoutSettingsForm } from "@/react-app/components/admin/AdminCheckoutSettingsForm";

export default function AdminCheckoutSettingsPage() {
  const m = useAdminSettings();

  if (m.loading) {
    return (
      <div className="w-full min-w-0 rounded-3xl border border-[#1B4332]/10 bg-white/90 p-12 text-center shadow-sm backdrop-blur-sm">
        <p className="font-inter text-[#6D4C41]">A carregar…</p>
      </div>
    );
  }

  return <AdminCheckoutSettingsForm m={m} />;
}
