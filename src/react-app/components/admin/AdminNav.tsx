import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Package, ShoppingBag, Activity, LogOut, Settings, Building2, FolderTree } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { isPlatformOperatorEmail } from "@/react-app/utils/platformOperator";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import LogoutConfirmModal from "@/react-app/components/LogoutConfirmModal";
import { useAdminMeQuery } from "@/react-app/hooks/useAdminMeQuery";

type AdminNavProps = {
  /** Ações da página (ex.: Atualizar) — ficam antes de Sair, alinhadas à direita. */
  children?: ReactNode;
};

export const AdminNav = ({ children }: AdminNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { settings } = useStoreSettings();
  const { data: me } = useAdminMeQuery();
  const role = me?.role ?? null;
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const storeName = settings?.displayName?.trim() || "Loja";

  const isAdminOrOwner = role === "admin" || role === "owner";
  const showPlatform = isPlatformOperatorEmail(user?.email);
  const links = [
    { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
    ...(isAdminOrOwner ? [{ to: "/admin/configuracoes", label: "Configurações", icon: Settings }] : []),
    ...(isAdminOrOwner ? [{ to: "/admin/historico", label: "Histórico", icon: Activity }] : []),
    { to: "/admin/produtos", label: "Produtos", icon: Package },
    { to: "/admin/categorias", label: "Categorias", icon: FolderTree },
    ...(showPlatform ? [{ to: "/admin/platform/dashboard", label: "Central", icon: Building2 }] : []),
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const linkClass = (isActive: boolean) =>
    `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors sm:gap-2 sm:px-4 ${
      isActive
        ? "bg-[var(--brand-primary)] text-white"
        : "border border-[color:var(--brand-primary)]/10 bg-white/60 text-[#6D4C41] hover:bg-white hover:text-[var(--brand-primary)]"
    }`;

  return (
    <nav className="flex w-full min-w-0 flex-col gap-0 font-inter" aria-label="Painel administrativo">
      {/* Barra superior: loja à esquerda, utilitários (Sair) à direita — evita competir com a linha de abas. */}
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--brand-primary)]/10 pb-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          {settings?.logoUrl?.trim() ? (
            <img src={settings.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
          ) : null}
          <p className="min-w-0 truncate font-semibold leading-snug text-[var(--brand-primary)] sm:text-lg">{storeName}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {children}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--brand-primary)]/15 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-[#6D4C41] shadow-sm transition-colors hover:bg-white hover:text-[var(--brand-primary)] sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
            aria-label="Sair do painel"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            Sair
          </button>
        </div>
      </div>

      <div className="flex flex-wrap justify-start gap-2 pt-3" role="tablist" aria-label="Seções do painel">
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
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </nav>
  );
};
