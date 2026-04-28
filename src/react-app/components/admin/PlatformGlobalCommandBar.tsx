import { Globe2, ShieldAlert, XCircle } from "lucide-react";

type PlatformGlobalCommandBarProps = {
  storeOverrideSlug: string | null;
  onClearStoreOverride: () => void;
};

/**
 * Faixa fixa no topo da Central de Comando: deixa explícito o modo gestão global (fora do contexto de uma loja).
 */
export const PlatformGlobalCommandBar = ({
  storeOverrideSlug,
  onClearStoreOverride,
}: PlatformGlobalCommandBarProps) => {
  return (
    <header
      className="sticky top-0 z-[100] border-b border-amber-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-2.5 text-amber-100 shadow-md"
      role="banner"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 font-inter text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
          <span className="font-semibold tracking-wide text-amber-200/95">Gestão global da plataforma</span>
          <span className="hidden text-slate-400 sm:inline">|</span>
          <span className="hidden min-w-0 items-center gap-1 text-slate-300 sm:flex">
            <Globe2 className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            <span className="truncate">Você não está “dentro” de uma loja — métricas são agregadas.</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs sm:text-sm">
          {storeOverrideSlug ? (
            <span className="max-w-[14rem] truncate rounded-md bg-slate-800/80 px-2 py-1 font-mono text-amber-100/90">
              override: {storeOverrideSlug}
            </span>
          ) : (
            <span className="rounded-md bg-slate-800/60 px-2 py-1 text-slate-400">sem override de loja</span>
          )}
          {storeOverrideSlug ? (
            <button
              type="button"
              onClick={onClearStoreOverride}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-slate-900/80 px-2 py-1 font-medium text-amber-200 transition hover:bg-slate-800"
            >
              <XCircle className="h-3.5 w-3.5" aria-hidden />
              Limpar override
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
};
