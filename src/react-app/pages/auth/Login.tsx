import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { LogIn, Loader2, AlertCircle, Eye, EyeOff, Copy } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";

const LAST_AUTH_ERROR_KEY = "lastAuthError";

function safeInternalPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  if (next.includes("://")) return null;
  return next;
}

/**
 * Interface de login do SaaS Auth Engine.
 * Estilo alinhado à loja: fundo creme, card claro, cores #1B4332 e #FFD166.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mostra o último erro de auth (401/403) que causou o redirect, para você poder ler e copiar
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_AUTH_ERROR_KEY);
      if (raw) {
        sessionStorage.removeItem(LAST_AUTH_ERROR_KEY);
        const parsed = JSON.parse(raw) as { status?: number; error?: string };
        if (parsed?.error) setError(`[${parsed.status ?? "?"}] ${parsed.error}`);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // Pequena espera para o Supabase emitir onAuthStateChange e o AuthContext atualizar antes de navegar
      await new Promise((r) => setTimeout(r, 300));
      const next = safeInternalPath(searchParams.get("next")?.trim() ?? null);
      navigate(next ?? "/admin/pedidos", { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Credenciais inválidas. Tente novamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] flex items-center justify-center px-4 font-inter">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#1B4332] font-playfair">
              Bem-vindo ao Painel de Gestão
            </h1>
            <p className="text-[#6D4C41] mt-2 text-sm">
              Mesma conta de e-mail e senha dos pedidos na loja ou do painel administrativo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#1B4332] mb-1.5"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#1B4332]/20 bg-white/80 text-[#1B4332] placeholder-[#6D4C41]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]/40"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#1B4332] mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#1B4332]/20 bg-white/80 text-[#1B4332] placeholder-[#6D4C41]/60 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]/40"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#6D4C41] hover:bg-[#1B4332]/10 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="flex-1 break-words">{error}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(error).then(() => {}, () => {});
                  }}
                  className="shrink-0 p-1 rounded hover:bg-red-100 text-red-600"
                  title="Copiar erro"
                  aria-label="Copiar mensagem de erro"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-[#1B4332] bg-gradient-to-r from-[#FFD166] to-[#FFE084] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 disabled:opacity-70 transition-all"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <LogIn className="h-5 w-5" aria-hidden />
              )}
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
