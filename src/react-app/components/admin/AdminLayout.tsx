import { Outlet } from "react-router";
import { AdminNav } from "@/react-app/components/admin/AdminNav";

/** Painel da loja — shell dark mode; conteúdo nas sub-rotas via Outlet. */
export const AdminLayout = () => (
  <div className="flex min-h-screen flex-col bg-surface">
    <header className="sticky top-0 z-40 border-b border-brand-primary/10 bg-surface-elevated/95 px-2.5 py-2 backdrop-blur-md sm:px-3 lg:px-4">
      <div className="mx-auto w-full max-w-[min(100%,1920px)]">
        <AdminNav />
      </div>
    </header>
    <main className="min-w-0 flex-1 px-2.5 pb-16 pt-4 sm:px-3 sm:pt-5 sm:pb-20 lg:px-4 lg:pb-24">
      <div className="mx-auto w-full min-w-0 max-w-[min(100%,1920px)]">
        <Outlet />
      </div>
    </main>
  </div>
);
