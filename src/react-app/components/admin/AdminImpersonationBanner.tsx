import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, Building2 } from "lucide-react";
import { clearStoreSlugOverride, getStoreSlugOverride } from "@/react-app/services/api";

/**
 * Quando existe `saas_store_slug_override` no `localStorage`, todas as chamadas `adminApiFetch`/`apiFetch`
 * enviam `x-store-slug` com esse valor — o Worker trata como se estivesses nessa loja.
 * Este banner aparece nas rotas sob `/admin/` (exceto `/admin/platform/*`, onde a Central já tem a sua faixa).
 *
 * "Sair do modo gerenciamento": remove o override e volta à Central — sem pedir password ao lojista.
 */
export const AdminImpersonationBanner = () => {
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

  const exitToCentral = () => {
    clearStoreSlugOverride();
    setSlug(null);
    navigate("/admin/platform/dashboard", { replace: true });
  };

  return (
    <div
      className="border-b border-amber-600/40 bg-gradient-to-r from-amber-950 via-[#422006] to-amber-950 px-4 py-2.5 text-amber-50 shadow-md"
      role="status"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2 sm:items-center">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300 sm:mt-0" aria-hidden />
          <p className="text-sm leading-snug">
            <strong className="text-amber-100">Modo personificação:</strong> estás a ver e a gerir o painel como se
            fosses desta loja: <span className="font-mono text-amber-200">{slug}</span>. As ações contam para esta
            vitrine até saíres deste modo.
          </p>
        </div>
        <button
          type="button"
          onClick={exitToCentral}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-amber-400/50 bg-amber-500/20 px-3 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-500/30 sm:self-center"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Sair do modo gerenciamento e voltar para a Central
        </button>
      </div>
    </div>
  );
};
