import { Search } from "lucide-react";
import { AuthPulseButton } from "@/react-app/components/auth/AuthPulseButton";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";

type PublicTrackFormProps = {
  orderId: string;
  email: string;
  onOrderIdChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
};

export function PublicTrackForm({
  orderId,
  email,
  onOrderIdChange,
  onEmailChange,
  onSubmit,
}: PublicTrackFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mb-8 space-y-4 rounded-3xl border border-brand-primary/15 bg-surface-elevated p-5 shadow-lg"
    >
      <p className="font-body text-sm text-content-muted">
        Use o número do pedido e o mesmo e-mail informados no checkout. O status atualiza automaticamente.
      </p>
      <div>
        <label htmlFor="track-order-id" className="mb-1 block text-xs font-semibold text-content-muted">
          Número do pedido
        </label>
        <input
          id="track-order-id"
          value={orderId}
          onChange={(e) => onOrderIdChange(e.target.value)}
          className={`${storefrontInputClass} font-mono text-sm`}
          placeholder="ex.: UUID do pedido"
          autoComplete="off"
        />
      </div>
      <div>
        <label htmlFor="track-email" className="mb-1 block text-xs font-semibold text-content-muted">
          E-mail do pedido
        </label>
        <input
          id="track-email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className={storefrontInputClass}
          placeholder="mesmo e-mail do checkout"
          autoComplete="email"
        />
      </div>
      <AuthPulseButton type="submit">
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        Consultar
      </AuthPulseButton>
    </form>
  );
}
