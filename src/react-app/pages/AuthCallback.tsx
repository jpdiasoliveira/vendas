import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/react-app/services/supabase";
import { safeInternalPath } from "@/react-app/constants/auth";
import {
  fetchMyStaffStores,
  syncStaffStoreSlugAfterLogin,
} from "@/react-app/services/api";

const hashParams = () => new URLSearchParams(window.location.hash.replace(/^#/, ""));

const readCallbackType = (search: URLSearchParams, hash: URLSearchParams) =>
  hash.get("type") ?? search.get("type");

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const finish = (path: string) => {
      if (!cancelled) navigate(path, { replace: true });
    };

    const run = async () => {
      try {
        const search = new URLSearchParams(window.location.search);
        const hash = hashParams();
        const code = search.get("code");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else {
          const accessToken = hash.get("access_token");
          const refreshToken = hash.get("refresh_token");
          if (accessToken && refreshToken) {
            const { error: setError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (setError) throw setError;
          }
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) {
          throw new Error("Link inválido ou expirado. Solicite um novo convite ou tente entrar novamente.");
        }

        const callbackType = readCallbackType(search, hash);
        const next = safeInternalPath(search.get("next"));

        if (callbackType === "invite" || callbackType === "recovery" || callbackType === "signup") {
          try {
            const staffStores = await fetchMyStaffStores();
            syncStaffStoreSlugAfterLogin(staffStores);
          } catch {
            /* convite pode ainda não ter membership propagado */
          }
          finish(next ?? "/admin/pedidos");
          return;
        }

        finish(next ?? "/");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Falha na autenticação. Por favor, tente novamente.");
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="w-full max-w-md rounded-3xl border border-brand-primary/15 bg-surface-elevated p-8 text-center shadow-2xl">
          <p className="mb-4 text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="rounded-3xl border border-brand-primary/15 bg-surface-elevated p-12 text-center shadow-2xl">
        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-brand-primary" aria-hidden />
        <p className="font-body text-lg text-content">Autenticando…</p>
      </div>
    </div>
  );
}
