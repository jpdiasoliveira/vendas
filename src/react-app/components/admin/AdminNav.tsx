import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Package, ShoppingBag, Activity, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { adminApiFetch } from "@/react-app/services/api";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import LogoutConfirmModal from "@/react-app/components/LogoutConfirmModal";

export function AdminNav() {
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
    <nav className="flex items-center gap-2 font-inter flex-wrap">
      {settings?.logoUrl?.trim() ? (
        <img
          src={settings.logoUrl}
          alt=""
          className="h-8 w-8 object-contain rounded mr-1"
        />
      ) : null}
      <span className="font-semibold text-[#1B4332] mr-2 hidden sm:inline">{storeName}</span>
      <span className="text-[#1B4332]/40 mr-1 hidden sm:inline">|</span>
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
      <button
        type="button"
        onClick={() => setShowLogoutModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#6D4C41] bg-white/60 hover:bg-white border border-[#1B4332]/10 hover:text-[#1B4332] transition-colors"
        aria-label="Sair do painel"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </nav>
  );
}
