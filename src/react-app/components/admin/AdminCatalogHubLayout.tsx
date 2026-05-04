import { NavLink, Outlet } from "react-router";
import { FolderTree, Package } from "lucide-react";

const tabs = [
  { to: "/admin/produtos/catalogo", label: "Catálogo", icon: Package },
  { to: "/admin/produtos/categorias", label: "Categorias", icon: FolderTree },
] as const;

/**
 * Hub **Produtos**: catálogo (SKUs) e categorias no mesmo sítio, com abas internas.
 */
export const AdminCatalogHubLayout = () => {
  return (
    <div className="w-full min-w-0">
      <div className="mb-6 border-b border-[color:var(--brand-primary)]/12 pb-4">
        <p className="mb-0.5 font-inter text-[11px] font-semibold uppercase tracking-wide text-[#6D4C41]/75">
          Produtos
        </p>
        <p className="mb-3 text-xs text-[#6D4C41]/80">Catálogo da loja e organização por categorias.</p>
        <nav className="flex flex-wrap gap-2" aria-label="Secções de produtos">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors sm:px-4 ${
                  isActive
                    ? "bg-[color:var(--brand-primary)]/12 text-[var(--brand-primary)] ring-1 ring-[color:var(--brand-primary)]/20"
                    : "text-[#6D4C41] hover:bg-black/5 hover:text-[var(--brand-primary)]"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
};
