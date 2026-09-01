import { useCallback, useMemo, useState, type ReactNode } from "react";
import { NavLink, Outlet } from "react-router";
import { CreditCard, Mail, Palette, TicketPercent, Truck } from "lucide-react";
import { adminHubSubnavLinkClassName } from "@/react-app/components/admin/adminHubSubnavClassName";
import type { AdminStoreHubOutletContext } from "@/react-app/components/admin/adminStoreHubOutletContext";

const tabs = [
  { to: "/admin/loja/vitrine", label: "Vitrine", icon: Palette },
  { to: "/admin/loja/checkout", label: "Checkout", icon: CreditCard },
  { to: "/admin/loja/frete", label: "Frete", icon: Truck },
  { to: "/admin/loja/cupons", label: "Cupons", icon: TicketPercent },
  { to: "/admin/loja/newsletter", label: "Newsletter", icon: Mail },
] as const;

/**
 * Hub **Marca e vitrine**: abas internas sem repetir entradas no menu principal.
 */
export const AdminStoreHubLayout = () => {
  const [hubToolbar, setHubToolbar] = useState<ReactNode>(null);
  const setStoreHubToolbar = useCallback((node: ReactNode | null) => {
    setHubToolbar(node);
  }, []);
  const outletContext = useMemo((): AdminStoreHubOutletContext => ({ setStoreHubToolbar }), [setStoreHubToolbar]);

  return (
    <div className="w-full min-w-0">
      <div className="mb-5 border-b border-[color:var(--brand-primary)]/12 pb-3">
        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-content-muted">
          Marca e vitrine
        </p>
        <p className="mb-3 text-xs text-content-muted/80">
          Aparência, checkout, frete, cupons e newsletter da loja.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <nav className="flex flex-wrap gap-1.5" aria-label="Secções marca e vitrine">
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
