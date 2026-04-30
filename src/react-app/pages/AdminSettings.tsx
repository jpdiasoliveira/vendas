import { useAdminSettings } from "@/react-app/hooks/useAdminSettings";
import { AdminSettingsFormBody } from "@/react-app/components/admin/AdminSettingsFormBody";

export default function AdminSettingsPage() {
  const m = useAdminSettings();

  if (m.loading) {
    return (
      <div className="rounded-2xl border border-[#1B4332]/10 bg-white/70 p-12 text-center shadow-sm backdrop-blur-sm">
        <p className="font-inter text-[#6D4C41]">Carregando configurações...</p>
      </div>
    );
  }

  return <AdminSettingsFormBody m={m} />;
}
