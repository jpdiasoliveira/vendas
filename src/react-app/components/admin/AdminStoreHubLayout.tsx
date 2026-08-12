import { NavLink, Outlet } from "react-router";
import { CreditCard, Mail, Palette } from "lucide-react";
import { adminHubSubnavLinkClassName } from "@/react-app/components/admin/adminHubSubnavClassName";

const tabs = [
  { to: "/admin/loja/vitrine", label: "Vitrine", icon: Palette },
  { to: "/admin/loja/checkout", label: "Checkout", icon: CreditCard },
  { to: "/admin/loja/newsletter", label: "Newsletter", icon: Mail },
] as const;

/**
 * Hub **Marca e vitrine**: abas internas (Vitrine, Checkout, Newsletter) sem repetir entradas no menu principal.
 */
export const AdminStoreHubLayout = () => {
  return (
    <div className="w-full min-w-0">
      <div className="mb-5 border-b border-[color:var(--brand-primary)]/12 pb-3">
        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-content-muted">
          Marca e vitrine
        </p>
        <p className="mb-3 text-xs text-content-muted/80">
          Aparência, textos da home, checkout público e lista de inscritos na newsletter.
        </p>
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
      </div>
      <Outlet />
    </div>
  );
};
