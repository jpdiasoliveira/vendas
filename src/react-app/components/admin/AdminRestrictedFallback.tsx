import { useNavigate } from "react-router";
import { ShieldOff } from "lucide-react";

type AdminRestrictedFallbackProps = {
  title?: string;
  message: string;
  backTo?: string;
  backLabel?: string;
};

export function AdminRestrictedFallback({
  title = "Acesso restrito",
  message,
  backTo = "/admin/pedidos",
  backLabel = "Voltar ao painel",
}: AdminRestrictedFallbackProps) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-md text-center">
      <ShieldOff className="mx-auto mb-4 h-16 w-16 text-content-muted/50" aria-hidden />
      <h1 className="mb-2 font-display text-xl font-bold text-content">{title}</h1>
      <p className="text-content-muted">{message}</p>
      <button
        type="button"
        onClick={() => navigate(backTo)}
        className="mt-6 rounded-xl bg-brand-primary px-4 py-2 font-medium text-white transition-colors hover:opacity-90"
      >
        {backLabel}
      </button>
    </div>
  );
}
