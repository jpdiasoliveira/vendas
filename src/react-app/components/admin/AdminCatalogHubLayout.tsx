import { useCallback, useMemo, useState, type ReactNode } from "react";
import { NavLink, Outlet } from "react-router";
import { FolderTree, Package } from "lucide-react";
import { adminHubSubnavLinkClassName } from "@/react-app/components/admin/adminHubSubnavClassName";
import type { AdminCatalogHubOutletContext } from "@/react-app/components/admin/adminCatalogHubOutletContext";

const tabs = [
  { to: "/admin/produtos/catalogo", label: "Catálogo", icon: Package },
  { to: "/admin/produtos/categorias", label: "Categorias", icon: FolderTree },
] as const;

/**
 * Hub **Produtos**: catálogo (SKUs) e categorias no mesmo sítio, com abas internas.
 */
export const AdminCatalogHubLayout = () => {
  const [hubToolbar, setHubToolbar] = useState<ReactNode>(null);
  const setCatalogHubToolbar = useCallback((node: ReactNode | null) => {
    setHubToolbar(node);
  }, []);
  const outletContext = useMemo(
    (): AdminCatalogHubOutletContext => ({ setCatalogHubToolbar }),
    [setCatalogHubToolbar]
  );

  return (
    <div className="w-full min-w-0">
      <div className="mb-4">
        <p className="mb-2 font-inter text-[11px] font-semibold uppercase tracking-wide text-[#6D4C41]/75">
          Produtos
        </p>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <nav className="flex flex-wrap gap-1.5" aria-label="Secções de produtos">
            {tabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => adminHubSubnavLinkClassName(isActive)}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
          {hubToolbar ? <div className="flex shrink-0 items-center">{hubToolbar}</div> : null}
        </div>
      </div>
      <Outlet context={outletContext} />
    </div>
  );
};
