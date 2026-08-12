import { NavLink } from "react-router";
import { Building2, Home, LayoutDashboard, Layers, LogOut, Plus, Settings } from "lucide-react";
import { platformNavLinkClass } from "@/react-app/components/platform/layout/platformNavClass";
import { PlatformOperatorSessionHint } from "@/react-app/components/platform/layout/PlatformOperatorSessionHint";

type PlatformSidebarProps = {
  operatorEmail: string | null;
  onNewStore: () => void;
  onLogoutClick: () => void;
};

export function PlatformSidebar({ operatorEmail, onNewStore, onLogoutClick }: PlatformSidebarProps) {
  return (
    <aside
      className="fixed bottom-0 left-0 top-0 z-[90] flex w-[260px] shrink-0 flex-col border-r border-brand-primary/10 bg-surface-elevated shadow-xl"
      aria-label="Navegação da Central de Comando"
    >
      <div className="flex min-h-[62px] w-full shrink-0 flex-col justify-center border-b border-brand-primary/10 px-3 py-2.5">
        <p className="font-display text-lg font-semibold leading-tight text-content">Central</p>
        <p className="mt-0.5 text-xs leading-snug text-content-muted">Gestão global da plataforma</p>
      </div>

      <div className="px-3 pt-4">
        <button
          type="button"
          onClick={onNewStore}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-3 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Nova Loja
        </button>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-0.5 px-3 pb-4" aria-label="Secções">
        <NavLink to="/admin/platform/dashboard" end className={platformNavLinkClass}>
          <LayoutDashboard className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          Dashboard
        </NavLink>
        <NavLink to="/admin/platform/lojas" className={platformNavLinkClass}>
          <Building2 className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          Gestor de Lojas
        </NavLink>
        <NavLink to="/admin/platform/planos" className={platformNavLinkClass}>
          <Layers className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          Planos e Regras
        </NavLink>
        <NavLink to="/admin/platform/configuracoes" className={platformNavLinkClass}>
          <Settings className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          Configurações
        </NavLink>
      </nav>

      <div className="mt-auto border-t border-brand-primary/10 px-3 py-4">
        <p className="truncate px-2 text-xs font-medium uppercase tracking-wider text-content-muted">Operador</p>
        <div className="mt-1.5 flex items-start gap-2 px-2">
          <p
            className={`min-w-0 flex-1 truncate text-sm leading-snug ${operatorEmail ? "font-mono text-content" : "italic text-content-muted"}`}
            title={operatorEmail ?? undefined}
          >
            {operatorEmail ?? "E-mail não disponível"}
          </p>
          <PlatformOperatorSessionHint operatorEmail={operatorEmail} />
        </div>
        <button
          type="button"
          onClick={onLogoutClick}
          className="mt-3 flex w-full items-center gap-2.5 rounded-xl border border-brand-primary/15 bg-surface-muted px-3 py-2.5 text-left text-sm font-medium text-content transition hover:bg-surface"
        >
          <LogOut className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          Sair
        </button>
        <NavLink
          to="/"
          className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-content-muted transition hover:bg-surface-muted hover:text-content"
        >
          <Home className="h-4 w-4 shrink-0" aria-hidden />
          Site público
        </NavLink>
      </div>
    </aside>
  );
}
