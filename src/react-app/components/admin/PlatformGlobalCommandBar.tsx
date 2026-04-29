import { XCircle } from "lucide-react";

type PlatformGlobalCommandBarProps = {
  storeOverrideSlug: string | null;
  onClearStoreOverride: () => void;
};

/**
 * Faixa superior mínima: apenas o estado de personificação (evita repetir "Central" / operador da sidebar).
 */
export const PlatformGlobalCommandBar = ({ storeOverrideSlug, onClearStoreOverride }: PlatformGlobalCommandBarProps) => {
  const hasFocus = Boolean(storeOverrideSlug?.trim());

  return (
    <header
      className="sticky top-0 z-[100] flex min-h-[62px] shrink-0 items-center border-b border-slate-800/20 bg-gradient-to-r from-slate-950 via-[#0f172a] to-slate-950"
      role="banner"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-2.5 font-inter sm:px-6 lg:px-8">
        {hasFocus ? (
          <div className="flex w-full max-w-2xl flex-wrap items-center justify-center gap-2 sm:justify-between sm:gap-3">
            <div
              className="flex min-w-0 max-w-full flex-col rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-center sm:max-w-md sm:text-left"
              role="status"
            >
              <span className="text-xs font-medium uppercase tracking-wider text-amber-200/90">Loja em foco</span>
              <span className="truncate font-mono text-sm font-semibold text-amber-50">{storeOverrideSlug}</span>
            </div>
            <button
              type="button"
              onClick={onClearStoreOverride}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-400/35 bg-slate-900/70 px-3 py-2 text-sm font-medium text-amber-100 transition hover:bg-slate-800"
            >
              <XCircle className="h-4 w-4 shrink-0" aria-hidden />
              Sair da loja
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-slate-500" role="status">
            Sem loja em foco neste navegador — o painel segue em modo plataforma.
          </p>
        )}
      </div>
    </header>
  );
};
