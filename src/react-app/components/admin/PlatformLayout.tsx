import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  Building2,
  Home,
  LayoutDashboard,
  Layers,
  LogOut,
  Plus,
  Settings,
} from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { PlatformShellProvider, usePlatformShell } from "@/react-app/contexts/PlatformShellContext";
import { PlatformGlobalCommandBar } from "@/react-app/components/admin/PlatformGlobalCommandBar";
import { PlatformNewStoreModal } from "@/react-app/components/admin/PlatformNewStoreModal";
import LogoutConfirmModal from "@/react-app/components/LogoutConfirmModal";
import { clearStoreSlugOverride, getStoreSlugOverride } from "@/react-app/services/api";
import { isPlatformOperatorEmail } from "@/react-app/utils/platformOperator";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-amber-500/20 text-amber-100"
      : "text-slate-300 hover:bg-white/5 hover:text-white"
  }`;

const PlatformLayoutInner = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const allowed = isPlatformOperatorEmail(user?.email);
  const { newStoreModalOpen, setNewStoreModalOpen, notifyStoresListChanged } = usePlatformShell();
  const [overrideSlug, setOverrideSlug] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user && !allowed) navigate("/admin/pedidos", { replace: true });
  }, [loading, user, allowed, navigate]);

  useEffect(() => {
    setOverrideSlug(getStoreSlugOverride());
  }, []);

  const clearOverride = () => {
    clearStoreSlugOverride();
    setOverrideSlug(null);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 font-inter text-slate-300">
        Carregando…
      </div>
    );
  }

  if (!allowed) return null;

  const operatorEmail = user?.email?.trim() || null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100/90 via-[#F5F1E8] to-[#FAF8F3] font-inter text-[#6D4C41]">
      <aside
        className="fixed bottom-0 left-0 top-0 z-[90] flex w-[260px] shrink-0 flex-col border-r border-slate-800/40 bg-slate-950 text-slate-100 shadow-xl"
        aria-label="Navegação da Central de Comando"
      >
        <div className="flex h-[86px] w-full shrink-0 flex-col justify-center border-b border-white/10 px-3">
          <p className="font-playfair text-lg font-semibold leading-tight text-white">Central</p>
          <p className="mt-1 text-xs leading-snug text-slate-400">Gestão global da plataforma</p>
        </div>

        <div className="px-3 pt-4">
          <button
            type="button"
            onClick={() => setNewStoreModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Nova Loja
          </button>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-0.5 px-3 pb-4" aria-label="Secções">
          <NavLink to="/admin/platform/dashboard" end className={navClass}>
            <LayoutDashboard className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Dashboard
          </NavLink>
          <NavLink to="/admin/platform/lojas" className={navClass}>
            <Building2 className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Gestor de Lojas
          </NavLink>
          <NavLink to="/admin/platform/planos" className={navClass}>
            <Layers className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Planos e Regras
          </NavLink>
          <NavLink to="/admin/platform/configuracoes" className={navClass}>
            <Settings className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Configurações
          </NavLink>
        </nav>

        <div className="mt-auto border-t border-white/10 px-3 py-4">
          <p className="truncate px-2 text-xs font-medium uppercase tracking-wider text-slate-400">Operador</p>
          <p
            className={`mt-1.5 truncate px-2 text-sm leading-snug text-slate-200 ${operatorEmail ? "font-mono" : "italic text-slate-400"}`}
            title={operatorEmail ?? undefined}
          >
            {operatorEmail ?? "E-mail não disponível"}
          </p>
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="mt-3 flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Sair
          </button>
          <NavLink
            to="/"
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
          >
            <Home className="h-4 w-4 shrink-0" aria-hidden />
            Site público
          </NavLink>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pl-[260px]">
        <PlatformGlobalCommandBar
          operatorEmail={user?.email ?? null}
          storeOverrideSlug={overrideSlug}
          onClearStoreOverride={clearOverride}
        />
        <main className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <PlatformNewStoreModal
        isOpen={newStoreModalOpen}
        onClose={() => setNewStoreModalOpen(false)}
        onCreated={() => notifyStoresListChanged()}
      />

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
};

export const PlatformLayout = () => (
  <PlatformShellProvider>
    <PlatformLayoutInner />
  </PlatformShellProvider>
);
