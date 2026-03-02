/**
 * Contexto de autenticação (SaaS Auth Engine).
 * Expõe UserContext em toda a aplicação com tipagem estrita.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  getSession,
  login as serviceLogin,
  logout as serviceLogout,
  type UserContext,
} from "@/react-app/services/auth.service";
import { supabase } from "@/react-app/lib/supabase";

export type AuthContextValue = {
  user: UserContext | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function sessionToUser(session: Session | null): UserContext | null {
  if (!session?.user) return null;
  const u = session.user;
  return { id: u.id, email: u.email ?? undefined };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession()
      .then((s) => {
        setSession(s);
        setLoading(false);
      })
      .catch((err) => {
        console.error("AuthContext: erro ao carregar sessão", err);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  const user = sessionToUser(session);

  // Debug: estado atual da sessão (remover em produção se desejar)
  useEffect(() => {
    console.log("Auth State:", { session: !!session, loading, user: user ?? null });
  }, [session, loading, user?.id]);

  const signIn = useCallback(async (email: string, password: string) => {
    await serviceLogin(email, password);
  }, []);

  const signOut = useCallback(async () => {
    await serviceLogout();
  }, []);

  const getAccessToken = useCallback(async () => {
    const s = await getSession();
    return s?.access_token ?? null;
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    signIn,
    signOut,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
