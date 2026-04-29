import { HelpCircle } from "lucide-react";

type PlatformOperatorSessionHintProps = {
  operatorEmail?: string | null;
};

/**
 * E-mail da sessão fora do fluxo visual principal: ícone de ajuda com painel ao clicar (funciona em touch).
 */
export const PlatformOperatorSessionHint = ({ operatorEmail }: PlatformOperatorSessionHintProps) => {
  const email = operatorEmail?.trim() || null;

  return (
    <details className="relative shrink-0">
      <summary
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 [&::-webkit-details-marker]:hidden"
        aria-label="Dados da sessão e ajuda"
      >
        <HelpCircle className="h-4 w-4" aria-hidden />
      </summary>
      <div
        className="absolute right-0 top-full z-[110] mt-1.5 w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-slate-700/90 bg-slate-900 px-3 py-2.5 text-left shadow-2xl ring-1 ring-black/20"
        role="region"
        aria-label="Informações da sessão"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sessão</p>
        <p className="mt-1 break-all font-mono text-sm text-amber-100/95">
          {email ?? "E-mail da sessão não disponível."}
        </p>
        <p className="mt-2 border-t border-white/10 pt-2 text-xs leading-relaxed text-slate-400">
          Conta autorizada a operar a gestão global da plataforma. Em caso de dúvidas, contacta a equipa técnica.
        </p>
      </div>
    </details>
  );
};
