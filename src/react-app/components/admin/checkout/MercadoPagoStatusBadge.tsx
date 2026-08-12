import type { StoreMpPaymentFlags } from "@/schemas/adminMercadoPago";

type MercadoPagoStatusBadgeProps = {
  flags: StoreMpPaymentFlags | undefined;
};

export function MercadoPagoStatusBadge({ flags }: MercadoPagoStatusBadgeProps) {
  const tokenOk = flags?.mpAccessTokenConfigured === true;
  const pkOk = flags?.mpPublicKeyConfigured === true;

  return (
    <div className="flex flex-wrap gap-2">
      <span
        className={`rounded-full border px-3 py-1 text-xs font-medium ${
          tokenOk
            ? "border-brand-primary/25 bg-brand-primary/10 text-brand-primary"
            : "border-brand-primary/15 bg-surface-muted text-content-muted"
        }`}
      >
        Access token: {tokenOk ? "guardado" : "não configurado"}
      </span>
      <span
        className={`rounded-full border px-3 py-1 text-xs font-medium ${
          pkOk
            ? "border-brand-primary/25 bg-brand-primary/10 text-brand-primary"
            : "border-brand-primary/15 bg-surface-muted text-content-muted"
        }`}
      >
        Public key: {pkOk ? "guardada" : "não configurada"}
      </span>
      <span
        className={`rounded-full border px-3 py-1 text-xs font-medium ${
          tokenOk
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "border-amber-500/30 bg-amber-500/10 text-amber-200"
        }`}
      >
        Integração: {tokenOk ? "ativa" : "inativa"}
      </span>
    </div>
  );
}
