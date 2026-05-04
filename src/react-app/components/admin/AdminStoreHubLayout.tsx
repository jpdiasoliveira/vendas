import { NavLink, Outlet } from "react-router";
import { CreditCard, Mail, Palette } from "lucide-react";

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
      <div className="mb-6 border-b border-[color:var(--brand-primary)]/12 pb-4">
        <p className="mb-0.5 font-inter text-[11px] font-semibold uppercase tracking-wide text-[#6D4C41]/75">
          Marca e vitrine
        </p>
        <p className="mb-3 text-xs text-[#6D4C41]/80">
          Aparência, textos da home, checkout público e lista de inscritos na newsletter.
        </p>
        <nav className="flex flex-wrap gap-2" aria-label="Secções marca e vitrine">
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
