import { useMemo } from "react";
import { useLocation } from "react-router";
import type { LucideIcon } from "lucide-react";
import { Activity, Building2, Package, Palette, ShoppingBag } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useStoreSettings } from "@/react-app/contexts/StoreSettingsContext";
import { useAdminMeQuery } from "@/react-app/hooks/useAdminMeQuery";
import { isPlatformOperatorEmail } from "@/react-app/utils/platformOperator";
import { storeLogoHeightPx } from "@/react-app/utils/storeLogoDisplay";

export type AdminNavLink = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const storeMarkInitial = (name: string) => {
  const t = name.trim();
  if (!t) return "L";
  return t.charAt(0).toLocaleUpperCase("pt-BR");
};

export function useAdminNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { settings } = useStoreSettings();
  const { data: me } = useAdminMeQuery();
  const role = me?.role ?? null;
  const isAdminOrOwner = role === "admin" || role === "owner";
  const showPlatform = isPlatformOperatorEmail(user?.email);
  const storeName = settings?.displayName?.trim() || "Loja";
  const logoUrl = settings?.logoUrl?.trim() ?? "";
  const adminLogoPx = Math.min(44, storeLogoHeightPx(settings));

  const links = useMemo<AdminNavLink[]>(
    () => [
      { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
      { to: "/admin/produtos/catalogo", label: "Produtos", icon: Package },
      ...(isAdminOrOwner
        ? [
            { to: "/admin/loja/vitrine", label: "Marca e vitrine", icon: Palette },
            { to: "/admin/historico", label: "Histórico", icon: Activity },
          ]
        : []),
      ...(showPlatform ? [{ to: "/admin/platform/dashboard", label: "Central", icon: Building2 }] : []),
    ],
    [isAdminOrOwner, showPlatform],
  );

  const pathActive = (to: string) => {
    if (to.startsWith("/admin/platform")) return location.pathname.startsWith("/admin/platform");
    if (to === "/admin/loja/vitrine") return location.pathname.startsWith("/admin/loja");
    if (to === "/admin/produtos/catalogo") return location.pathname.startsWith("/admin/produtos");
    return location.pathname === to;
  };

  const markInitial = useMemo(() => storeMarkInitial(storeName), [storeName]);

  return { links, pathActive, storeName, logoUrl, adminLogoPx, markInitial, role };
}
