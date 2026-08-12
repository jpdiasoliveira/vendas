import { useNavigate } from "react-router";
import { Package } from "lucide-react";
import { AuthPulseButton } from "@/react-app/components/auth/AuthPulseButton";

export function EmptyOrders() {
  const navigate = useNavigate();

  return (
    <div className="rounded-3xl border border-brand-primary/15 bg-surface-elevated p-12 text-center shadow-xl">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-accent-soft">
        <Package className="h-12 w-12 text-brand-primary/60" aria-hidden />
      </div>
      <h2 className="mb-3 font-display text-2xl font-bold text-content">Nenhum pedido encontrado</h2>
      <p className="mb-8 font-body text-content-muted">Você ainda não realizou nenhuma compra conosco.</p>
      <AuthPulseButton type="button" onClick={() => navigate("/")} className="mx-auto max-w-xs">
        Começar a comprar
      </AuthPulseButton>
    </div>
  );
}
