import { LogIn, Eye, EyeOff } from "lucide-react";
import { AuthPulseButton } from "@/react-app/components/auth/AuthPulseButton";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import { useLoginForm } from "@/react-app/hooks/auth/useLoginForm";
import { useAuth } from "@/react-app/contexts/AuthContext";

type LoginFormProps = {
  onSuccess?: () => void;
  redirectTo?: string;
};

export function LoginForm({ onSuccess, redirectTo }: LoginFormProps = {}) {
  const form = useLoginForm({ onSuccess, redirectTo });
  const { signInWithGoogle } = useAuth();

  return (
    <form onSubmit={(event) => void form.handleSubmit(event)} className="space-y-5" noValidate>
      <div>
        <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-content-muted">
          E-mail
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => form.setEmail(event.target.value)}
          required
          className={storefrontInputClass}
          placeholder="seu@email.com"
        />
      </div>

      <div>
        <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-content-muted">
          Senha
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={form.showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => form.setPassword(event.target.value)}
            required
            className={`${storefrontInputClass} pr-12`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => form.setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-content-muted transition hover:bg-surface-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
            aria-label={form.showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {form.showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AuthPulseButton type="submit" loading={form.loading} disabled={form.loading}>
        {!form.loading ? <LogIn className="h-5 w-5" aria-hidden /> : null}
        {form.loading ? "Entrando…" : "Entrar"}
      </AuthPulseButton>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-surface-muted"></div>
        <span className="flex-shrink-0 mx-4 text-content-muted text-sm">ou</span>
        <div className="flex-grow border-t border-surface-muted"></div>
      </div>
      
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black font-semibold h-12 hover:bg-gray-100 transition shadow-sm border border-gray-200"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Entrar com Google
      </button>
    </form>
  );
}
