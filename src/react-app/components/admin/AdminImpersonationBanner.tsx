import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { clearStoreSlugOverride, getStoreSlugOverride } from "@/react-app/services/api";
import { isPlatformOperatorEmail } from "@/react-app/utils/platformOperator";

/**
 * Só para **operador da Central** (`VITE_PLATFORM_OPERATOR_EMAILS`) com override de loja no browser:
 * lembra que as APIs vão nesse tenant e oferece saída para a Central.
 * Dono da loja (slug por login/sync) não vê esta faixa — não é “personificação”.
 */
export const AdminImpersonationBanner = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [slug, setSlug] = useState<string | null>(() => getStoreSlugOverride());

  useEffect(() => {
    setSlug(getStoreSlugOverride());
  }, [location.pathname]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "saas_store_slug_override" || e.key === null) setSlug(getStoreSlugOverride());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (location.pathname.startsWith("/admin/platform")) return null;
  if (!slug) return null;
  if (!isPlatformOperatorEmail(user?.email)) return null;

  const exitToCentral = () => {
    clearStoreSlugOverride();
    setSlug(null);
    navigate("/admin/platform/dashboard", { replace: true });
  };

  return (
    <div
      className="border-b border-amber-700/30 bg-amber-950/80 px-4 py-1.5 text-amber-100/95 shadow-sm"
      role="status"
      aria-label={`Loja em foco: ${slug}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs tabular-nums text-amber-200/90">
          <span className="text-amber-400/80">Loja:</span>{" "}
          <span className="font-mono text-amber-100">{slug}</span>
        </p>
        <button
          type="button"
          onClick={exitToCentral}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-50 transition hover:bg-amber-500/25"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Voltar à Central
        </button>
      </div>
    </div>
  );
};
