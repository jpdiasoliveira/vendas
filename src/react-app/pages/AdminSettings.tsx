import { useAdminSettings } from "@/react-app/hooks/useAdminSettings";
import { AdminSettingsFormBody } from "@/react-app/components/admin/AdminSettingsFormBody";

export default function AdminSettingsPage() {
  const m = useAdminSettings();

  if (m.loading) {
    return (
      <div className="px-2.5 pb-24 pt-6 sm:px-3 lg:px-4">
        <div className="mx-auto w-full max-w-[min(100%,1920px)]">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 text-center shadow-sm border border-[#1B4332]/10">
            <p className="text-[#6D4C41] font-inter">Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2.5 pb-24 pt-6 sm:px-3 lg:px-4">
      <AdminSettingsFormBody m={m} />
    </div>
  );
}
