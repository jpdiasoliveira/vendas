import { HelpCircle } from "lucide-react";

type PlatformOperatorSessionHintProps = {
  operatorEmail?: string | null;
};

export const PlatformOperatorSessionHint = ({ operatorEmail }: PlatformOperatorSessionHintProps) => {
  const email = operatorEmail?.trim() || null;

  return (
    <details className="relative shrink-0">
      <summary
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg text-content-muted transition hover:bg-surface-muted hover:text-content focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 [&::-webkit-details-marker]:hidden"
        aria-label="Dados da sessão e ajuda"
      >
        <HelpCircle className="h-4 w-4" aria-hidden />
      </summary>
      <div
        className="absolute right-0 top-full z-[110] mt-1.5 w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-brand-primary/15 bg-surface-elevated px-3 py-2.5 text-left shadow-2xl"
        role="region"
        aria-label="Informações da sessão"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">Sessão</p>
        <p className="mt-1 break-all font-mono text-sm text-content">{email ?? "E-mail da sessão não disponível."}</p>
        <p className="mt-2 border-t border-brand-primary/10 pt-2 text-xs leading-relaxed text-content-muted">
          Conta autorizada a operar a gestão global da plataforma.
        </p>
      </div>
    </details>
  );
};
