import { useAdminSettings } from "@/react-app/hooks/useAdminSettings";
import { AdminSettingsFormBody } from "@/react-app/components/admin/AdminSettingsFormBody";

export default function AdminSettingsPage() {
  const m = useAdminSettings();

  if (m.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] pt-24 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 text-center shadow-sm border border-[#1B4332]/10">
            <p className="text-[#6D4C41] font-inter">Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <AdminSettingsFormBody m={m} />
    </div>
  );
}
