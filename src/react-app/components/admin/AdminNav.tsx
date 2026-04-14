import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Package, ShoppingBag, Activity, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { adminApiFetch } from "@/react-app/services/api";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import LogoutConfirmModal from "@/react-app/components/LogoutConfirmModal";

type AdminNavProps = {
  /** Ações da página (ex.: Atualizar) — ficam antes de Sair, alinhadas à direita. */
  children?: ReactNode;
};

export const AdminNav = ({ children }: AdminNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { settings } = useStoreSettings();
  const [role, setRole] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const storeName = settings?.displayName?.trim() || "Loja";

  useEffect(() => {
    adminApiFetch<{ id: string; role: string }>("/api/admin/me")
      .then((data) => setRole(data.role))
      .catch(() => setRole(null));
  }, []);

  const isAdminOrOwner = role === "admin" || role === "owner";
  const links = [
    { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
    ...(isAdminOrOwner ? [{ to: "/admin/configuracoes", label: "Configurações", icon: Settings }] : []),
    ...(role === "admin" ? [{ to: "/admin/historico", label: "Histórico", icon: Activity }] : []),
    { to: "/admin/produtos", label: "Produtos", icon: Package },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <nav
      className="flex w-full min-w-0 flex-col gap-3 font-inter sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      aria-label="Painel administrativo"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {settings?.logoUrl?.trim() ? (
          <img
            src={settings.logoUrl}
            alt=""
            className="mr-1 h-8 w-8 rounded object-contain"
          />
        ) : null}
        <span className="mr-2 hidden font-semibold text-[#1B4332] sm:inline">{storeName}</span>
        <span className="mr-1 hidden text-[#1B4332]/40 sm:inline">|</span>
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#1B4332] text-white"
                  : "border border-[#1B4332]/10 bg-white/60 text-[#6D4C41] hover:bg-white hover:text-[#1B4332]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </div>
      <div className="flex shrink-0 flex-nowrap items-center gap-2 sm:justify-end">
        {children}
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-[#1B4332]/10 bg-white/60 px-4 py-2 text-sm font-medium text-[#6D4C41] transition-colors hover:bg-white hover:text-[#1B4332]"
          aria-label="Sair do painel"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </button>
      </div>
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </nav>
  );
};
