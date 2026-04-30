import { Outlet } from "react-router";
import { AdminNav } from "@/react-app/components/admin/AdminNav";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { isStoreLogoKnockoutWhite } from "@/react-app/utils/storeLogoDisplay";

/**
 * Painel da loja: nav fixa no topo (uma montagem) e conteúdo nas sub-rotas via Outlet.
 */
export const AdminLayout = () => {
  const { settings } = useStoreSettings();
  const logoKnockoutBlend =
    Boolean(settings?.logoUrl?.trim()) && isStoreLogoKnockoutWhite(settings);
  const headerSurface = logoKnockoutBlend
    ? "border-b border-[color:var(--brand-primary)]/10 bg-[#FAF8F3] px-2.5 py-2 sm:px-3 sm:py-2 lg:px-4"
    : "border-b border-[color:var(--brand-primary)]/10 bg-[#FAF8F3]/95 px-2.5 py-2 backdrop-blur-md sm:px-3 sm:py-2 lg:px-4";

  return (
  <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3]">
    {/* Mesmo padding horizontal e largura máxima do conteúdo abaixo — borda esquerda/direita alinhada ao menu. */}
    <header className={`sticky top-0 z-40 ${headerSurface}`}>
      <div className="mx-auto w-full max-w-[min(100%,1920px)]">
        <AdminNav />
      </div>
    </header>
    <main className="min-w-0 flex-1 px-2.5 pb-16 pt-4 sm:px-3 sm:pt-5 sm:pb-20 lg:px-4 lg:pb-24">
      <div className="mx-auto w-full max-w-[min(100%,1920px)]">
        <Outlet />
      </div>
    </main>
  </div>
  );
};
