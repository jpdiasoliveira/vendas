import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
    <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" aria-label="Carregando" />
  </div>
);

/**
 * Envolve rotas protegidas do painel admin.
 * Só decide redirecionar após loading === false; dá 150ms de grace period para a sessão sincronizar (evita auto-logout após login).
 */
export const AdminGuard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gracePeriod, setGracePeriod] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (user) {
      setGracePeriod(false);
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
      return;
    }
    // Grace period: evita redirecionar antes da sessão ter sido atualizada após login
    redirectTimeoutRef.current = setTimeout(() => {
      redirectTimeoutRef.current = null;
      setGracePeriod(false);
      navigate("/login", { state: { from: location.pathname }, replace: true });
    }, 150);

    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    };
  }, [user, loading, navigate, location.pathname]);

  if (loading || (gracePeriod && !user)) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  return <Outlet />;
};
