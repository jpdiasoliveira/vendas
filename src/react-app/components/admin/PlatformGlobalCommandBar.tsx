import { UserRound, XCircle } from "lucide-react";
import { PlatformOperatorSessionHint } from "@/react-app/components/admin/PlatformOperatorSessionHint";

type PlatformGlobalCommandBarProps = {
  operatorEmail?: string | null;
  storeOverrideSlug: string | null;
  onClearStoreOverride: () => void;
};

const StoreFocusStatus = ({
  storeOverrideSlug,
  onClear,
}: {
  storeOverrideSlug: string | null;
  onClear: () => void;
}) => {
  const hasFocus = Boolean(storeOverrideSlug?.trim());

  if (hasFocus) {
    return (
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
        <div
          className="min-w-0 max-w-[min(100%,20rem)] rounded-lg border border-amber-400/45 bg-amber-500/15 px-3 py-2 ring-1 ring-amber-400/25"
          role="status"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/90">Loja em foco</p>
          <p className="mt-0.5 truncate font-mono text-sm font-medium text-amber-50">{storeOverrideSlug}</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-400/40 bg-slate-900/80 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-slate-800"
        >
          <XCircle className="h-4 w-4 shrink-0" aria-hidden />
          Sair da loja
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex min-w-0 flex-1 items-center justify-end"
      role="status"
      aria-live="polite"
    >
      <p className="truncate rounded-lg border border-slate-600/40 bg-slate-800/35 px-3 py-2 text-sm font-medium text-slate-400 ring-1 ring-slate-700/30">
        Nenhuma loja em foco no navegador
      </p>
    </div>
  );
};

/**
 * Faixa superior da área principal da Central (`/admin/platform/*`).
 * Conteúdo mínimo: função (badge) + estado de personificação + sessão fora do fluxo principal.
 */
export const PlatformGlobalCommandBar = ({
  operatorEmail,
  storeOverrideSlug,
  onClearStoreOverride,
}: PlatformGlobalCommandBarProps) => {
  return (
    <header
      className="sticky top-0 z-[100] h-[86px] shrink-0 border-b border-amber-500/40 bg-gradient-to-r from-slate-950 via-[#0f172a] to-slate-950 shadow-lg"
      role="banner"
    >
      <div className="mx-auto flex h-full w-full max-w-6xl items-center px-4 font-inter sm:px-6 lg:px-8">
        <div className="flex h-full w-full min-w-0 items-center gap-3 sm:gap-5">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-sm font-medium text-slate-300">
            <UserRound className="h-4 w-4 text-slate-400" aria-hidden />
            Operador
          </span>

          <StoreFocusStatus storeOverrideSlug={storeOverrideSlug} onClear={onClearStoreOverride} />

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <PlatformOperatorSessionHint operatorEmail={operatorEmail} />
          </div>
        </div>
      </div>
    </header>
  );
};
