/**
 * Contexto de autenticação (SaaS Auth Engine).
 * Expõe UserContext em toda a aplicação com tipagem estrita.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  login as serviceLogin,
  logout as serviceLogout,
  type UserContext,
} from "@/react-app/services/auth.service";
import { getSession, getAccessToken as getAccessTokenFromSession } from "@/react-app/services/authSession";
import { supabase } from "@/react-app/services/supabase";
import {
  fetchMyStaffStores,
  syncStaffStoreSlugAfterLogin,
} from "@/react-app/services/api";
import { queryClient } from "@/react-app/query/queryClient";
import { adminMeQueryKey, storeSettingsQueryKey } from "@/react-app/query/queryKeys";

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

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    let cancelled = false;
    void (async () => {
      try {
        const stores = await fetchMyStaffStores();
        if (!cancelled) syncStaffStoreSlugAfterLogin(stores);
      } catch (err) {
        console.error("AuthContext: falha ao sincronizar slug da loja", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const user = sessionToUser(session);

  // signIn: delega ao serviço de auth (Supabase). useCallback([]): referência estável para o objeto memoizado `value` abaixo.
  const signIn = useCallback(async (email: string, password: string) => {
    await serviceLogin(email, password);
  }, []);

  // signOut: encerra sessão no cliente. useCallback: não recriar função a cada render do Provider.
  const signOut = useCallback(async () => {
    await serviceLogout();
    queryClient.removeQueries({ queryKey: adminMeQueryKey });
    void queryClient.invalidateQueries({ queryKey: storeSettingsQueryKey });
    void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "store-settings-form"] });
  }, []);

  // getAccessToken: lê token atual (ex.: chamadas admin). useCallback: mesma referência entre renders.
  const getAccessToken = useCallback(() => getAccessTokenFromSession(), []);

  // value: agrega sessão, utilizador derivado e ações de login/logout/token.
  // useMemo([user, session, loading, …]): o Provider não deve passar um objeto literal novo a cada render — isso dispara re-renders em toda a árvore que consome useAuth() mesmo quando nada mudou.
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      signIn,
      signOut,
      getAccessToken,
    }),
    [user, session, loading, signIn, signOut, getAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
