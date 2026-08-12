import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useToast } from "@/react-app/providers/ToastProvider";
import {
  fetchMyStaffStores,
  syncStaffStoreSlugAfterLogin,
} from "@/react-app/services/api";
import { LAST_AUTH_ERROR_KEY, safeInternalPath } from "@/react-app/constants/auth";

type UseLoginFormOptions = {
  onSuccess?: () => void;
  /** Redirecionamento após login (ignora `?next=` quando definido). */
  redirectTo?: string;
};

export function useLoginForm(options: UseLoginFormOptions = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_AUTH_ERROR_KEY);
      if (!raw) return;
      sessionStorage.removeItem(LAST_AUTH_ERROR_KEY);
      const parsed = JSON.parse(raw) as { status?: number; error?: string };
      if (parsed?.error) {
        showToast({
          type: "error",
          message: `[${parsed.status ?? "?"}] ${parsed.error}`,
        });
      }
    } catch {
      /* ignore */
    }
  }, [showToast]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (loading) return;
      setLoading(true);
      try {
        await signIn(email.trim(), password);
        const staffStores = await fetchMyStaffStores();
        syncStaffStoreSlugAfterLogin(staffStores);
        await new Promise((resolve) => setTimeout(resolve, 150));
        options.onSuccess?.();
        const next =
          options.redirectTo ??
          safeInternalPath(searchParams.get("next")?.trim() ?? null) ??
          "/admin/pedidos";
        navigate(next, { replace: true });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Credenciais inválidas. Tente novamente.";
        showToast({ type: "error", message });
      } finally {
        setLoading(false);
      }
    },
    [email, password, loading, signIn, navigate, searchParams, showToast, options.onSuccess, options.redirectTo],
  );

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    loading,
    handleSubmit,
  };
}
