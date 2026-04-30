import { useAdminSettings } from "@/react-app/hooks/useAdminSettings";
import { AdminCheckoutSettingsForm } from "@/react-app/components/admin/AdminCheckoutSettingsForm";

export default function AdminCheckoutSettingsPage() {
  const m = useAdminSettings();

  if (m.loading) {
    return (
      <div className="rounded-2xl border border-[#1B4332]/10 bg-white/70 p-12 text-center shadow-sm backdrop-blur-sm">
        <p className="font-inter text-[#6D4C41]">A carregar…</p>
      </div>
    );
  }

  return <AdminCheckoutSettingsForm m={m} />;
}
