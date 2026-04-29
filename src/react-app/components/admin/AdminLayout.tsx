import { Outlet } from "react-router";
import { AdminNav } from "@/react-app/components/admin/AdminNav";

/**
 * Painel da loja: nav fixa no topo (uma montagem) e conteúdo nas sub-rotas via Outlet.
 */
export const AdminLayout = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3]">
    {/* Mesmo alinhamento horizontal da página de Configurações (evita nav “deslocada” vs. formulário / pré-visualização). */}
    <header className="sticky top-0 z-40 border-b border-[color:var(--brand-primary)]/10 bg-[#FAF8F3]/95 px-2.5 py-3 backdrop-blur-md sm:px-3 sm:py-3.5 lg:px-4">
      <div className="mx-auto w-full max-w-[min(100%,1920px)]">
        <AdminNav />
      </div>
    </header>
    <Outlet />
  </div>
);
