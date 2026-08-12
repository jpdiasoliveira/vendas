import { Search } from "lucide-react";
import { AuthPulseButton } from "@/react-app/components/auth/AuthPulseButton";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";

type GuestOrderLookupFormProps = {
  orderId: string;
  email: string;
  loading: boolean;
  onOrderIdChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSearch: () => void;
};

export function GuestOrderLookupForm({
  orderId,
  email,
  loading,
  onOrderIdChange,
  onEmailChange,
  onSearch,
}: GuestOrderLookupFormProps) {
  return (
    <>
      <h2 id="guest-order-lookup-title" className="mb-2 pr-10 font-display text-2xl font-bold text-content">
        Consultar pedido
      </h2>
      <p className="mb-6 font-body text-sm text-content-muted">
        Use o mesmo e-mail informado no checkout sem login e o código do pedido (enviado após a finalização).
      </p>
      <div className="space-y-4">
        <div>
          <label htmlFor="guest-order-id" className="mb-1 block text-sm font-medium text-content-muted">
            Número do pedido
          </label>
          <input
            id="guest-order-id"
            type="text"
            autoComplete="off"
            value={orderId}
            onChange={(e) => onOrderIdChange(e.target.value)}
            placeholder="Ex.: a1b2c3d4-..."
            className={`${storefrontInputClass} font-mono text-sm`}
          />
        </div>
        <div>
          <label htmlFor="guest-order-email" className="mb-1 block text-sm font-medium text-content-muted">
            E-mail
          </label>
          <input
            id="guest-order-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="mesmo e-mail do pedido"
            className={storefrontInputClass}
          />
        </div>
        <AuthPulseButton type="button" loading={loading} disabled={loading} onClick={() => void onSearch()}>
          {!loading ? <Search className="h-5 w-5 shrink-0" aria-hidden /> : null}
          {loading ? "Buscando…" : "Buscar pedido"}
        </AuthPulseButton>
      </div>
    </>
  );
}
