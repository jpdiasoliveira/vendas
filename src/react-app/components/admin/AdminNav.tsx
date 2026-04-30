import { useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Package, ShoppingBag, Activity, LogOut, Settings, Building2, FolderTree, CreditCard } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { isPlatformOperatorEmail } from "@/react-app/utils/platformOperator";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import LogoutConfirmModal from "@/react-app/components/LogoutConfirmModal";
import { useAdminMeQuery } from "@/react-app/hooks/useAdminMeQuery";
import { isStoreLogoKnockoutWhite, storeLogoHeightPx } from "@/react-app/utils/storeLogoDisplay";

type AdminNavProps = {
  children?: ReactNode;
};

const storeMarkInitial = (name: string) => {
  const t = name.trim();
  if (!t) return "L";
  return t.charAt(0).toLocaleUpperCase("pt-BR");
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
  const logoUrl = settings?.logoUrl?.trim() ?? "";
  const adminLogoPx = Math.min(44, storeLogoHeightPx(settings));
  const adminLogoKnockout = isStoreLogoKnockoutWhite(settings);

  const markInitial = useMemo(() => storeMarkInitial(storeName), [storeName]);

  const isAdminOrOwner = role === "admin" || role === "owner";
  const showPlatform = isPlatformOperatorEmail(user?.email);

  const links = [
    { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
    { to: "/admin/produtos", label: "Produtos", icon: Package },
    { to: "/admin/categorias", label: "Categorias", icon: FolderTree },
    ...(isAdminOrOwner
      ? [
          { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
          { to: "/admin/checkout", label: "Checkout", icon: CreditCard },
          { to: "/admin/historico", label: "Histórico", icon: Activity },
        ]
      : []),
    ...(showPlatform ? [{ to: "/admin/platform/dashboard", label: "Central", icon: Building2 }] : []),
  ] as const;

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const linkClass = (isActive: boolean) =>
    `inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-[13px] ${
      isActive
        ? "bg-[color:var(--brand-primary)]/12 text-[var(--brand-primary)] ring-1 ring-[color:var(--brand-primary)]/20"
        : "text-[#6D4C41]/90 hover:bg-black/5 hover:text-[var(--brand-primary)]"
    }`;

  const pathActive = (to: string) =>
    to.startsWith("/admin/platform") ? location.pathname.startsWith("/admin/platform") : location.pathname === to;

  return (
    <nav className="flex w-full min-w-0 items-center gap-2 font-inter sm:gap-3" aria-label="Painel administrativo">
      {/* Identidade da loja */}
      <div className="flex min-w-0 max-w-[38%] shrink-0 items-center gap-2 sm:max-w-[min(16rem,42%)]">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            style={{ height: `${adminLogoPx}px`, width: "auto" }}
            className={`max-h-11 w-auto shrink-0 rounded-full object-cover ring-1 ring-[color:var(--brand-primary)]/15 ${
              adminLogoKnockout ? "mix-blend-multiply" : ""
            }`}
          />
        ) : (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-primary)]/12 text-[0.7rem] font-bold tabular-nums text-[var(--brand-primary)] ring-1 ring-[color:var(--brand-primary)]/18"
            aria-hidden
          >
            {markInitial}
          </span>
        )}
        <span className="min-w-0 truncate font-playfair text-base font-semibold leading-tight tracking-tight text-[var(--brand-primary)] sm:text-lg">
          {storeName}
        </span>
      </div>

      {/* Navegação — centralizada no espaço restante */}
      <div
        className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Seções do painel"
      >
        <div className="flex min-h-[2.25rem] items-center justify-center gap-0.5 sm:gap-1">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = pathActive(to);
            return (
              <Link key={to} to={to} className={linkClass(isActive)} role="tab" aria-selected={isActive}>
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-80 sm:h-4 sm:w-4" aria-hidden />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {children}
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--brand-primary)]/12 bg-white/70 px-2 py-1.5 text-xs font-medium text-[#6D4C41] transition-colors hover:border-[color:var(--brand-primary)]/22 hover:bg-white hover:text-[var(--brand-primary)] sm:gap-1.5 sm:px-2.5 sm:text-[13px]"
          aria-label="Sair do painel"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Sair</span>
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
