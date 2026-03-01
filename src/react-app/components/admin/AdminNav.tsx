import { Link, useLocation } from "react-router";
import { Package, ShoppingBag } from "lucide-react";

const links = [
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
];

export function AdminNav() {
  const location = useLocation();

  return (
    <nav className="flex gap-2 font-inter">
      {links.map(({ to, label, icon: Icon }) => {
        const isActive = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? "bg-[#1B4332] text-white"
                : "bg-white/60 text-[#6D4C41] hover:bg-white hover:text-[#1B4332] border border-[#1B4332]/10"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
