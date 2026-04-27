import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Package, ShoppingBag, Activity, LogOut, Settings, Building2, FolderTree } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { isPlatformOperatorEmail } from "@/react-app/utils/platformOperator";
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
  const { signOut, user } = useAuth();
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
  const showPlatform = isPlatformOperatorEmail(user?.email);
  const links = [
    { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
    ...(isAdminOrOwner ? [{ to: "/admin/configuracoes", label: "Configurações", icon: Settings }] : []),
    ...(isAdminOrOwner ? [{ to: "/admin/historico", label: "Histórico", icon: Activity }] : []),
    { to: "/admin/produtos", label: "Produtos", icon: Package },
    { to: "/admin/categorias", label: "Categorias", icon: FolderTree },
    ...(showPlatform ? [{ to: "/admin/plataforma", label: "Plataforma", icon: Building2 }] : []),
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const linkClass = (isActive: boolean) =>
    `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors sm:gap-2 sm:px-4 ${
      isActive
        ? "bg-[#1B4332] text-white"
        : "border border-[#1B4332]/10 bg-white/60 text-[#6D4C41] hover:bg-white hover:text-[#1B4332]"
    }`;

  return (
    <nav className="flex w-full min-w-0 flex-col gap-3 font-inter" aria-label="Painel administrativo">
      <div className="flex items-center gap-2.5 border-b border-[#1B4332]/10 pb-2.5">
        {settings?.logoUrl?.trim() ? (
          <img src={settings.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
        ) : null}
        <p className="min-w-0 text-balance font-semibold leading-snug text-[#1B4332] sm:text-lg">{storeName}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Seções do painel">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link key={to} to={to} className={linkClass(isActive)} role="tab" aria-selected={isActive}>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
          {children}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#1B4332]/10 bg-white/60 px-3 py-2 text-sm font-medium text-[#6D4C41] transition-colors hover:bg-white hover:text-[#1B4332] sm:px-4"
            aria-label="Sair do painel"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sair
          </button>
        </div>
      </div>
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </nav>
  );
};
