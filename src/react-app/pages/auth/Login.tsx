import { LoginCard } from "@/react-app/components/auth/LoginCard";
import { LoginForm } from "@/react-app/components/auth/LoginForm";

/** Login e-mail/senha (Supabase) — painel e pedidos na loja. */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <LoginCard>
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold text-content">Bem-vindo ao Painel de Gestão</h1>
          <p className="mt-2 font-body text-sm text-content-muted">
            Mesma conta de e-mail e senha dos pedidos na loja ou do painel administrativo.
          </p>
        </div>
        <LoginForm />
      </LoginCard>
    </div>
  );
}
