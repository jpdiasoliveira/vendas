import { useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";

/**
 * Envolve rotas protegidas do painel admin.
 * Se não houver sessão ativa, redireciona de forma suave para /login.
 */
export const AdminGuard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { state: { from: location.pathname }, replace: true });
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <Loader2
          className="h-8 w-8 text-emerald-500 animate-spin"
          aria-label="Carregando"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <Outlet />;
};
