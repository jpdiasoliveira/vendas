import { Link } from "react-router";

type OrderConfirmationErrorProps = {
  message: string;
};

export function OrderConfirmationError({ message }: OrderConfirmationErrorProps) {
  return (
    <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-6 text-center">
      <p className="mb-4 font-body text-sm text-red-200">{message}</p>
      <Link
        to="/pedidos"
        className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-brand-primary/25 bg-surface-elevated px-6 py-3 font-body text-sm font-semibold text-content transition hover:bg-surface-muted"
      >
        Ir para meus pedidos
      </Link>
    </div>
  );
}

import { AlertTriangle } from "lucide-react";

export function OrderStockConflictAlert() {
  return (
    <div className="flex gap-3 rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-100">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">Pedido cancelado por indisponibilidade de estoque</p>
        <p className="mt-1 text-red-200/90">
          Se o pagamento foi debitado, a loja precisará reembolsar pelo Mercado Pago. Guarde o número do pedido.
        </p>
      </div>
    </div>
  );
}
