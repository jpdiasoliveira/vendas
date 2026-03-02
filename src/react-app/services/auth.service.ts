/**
 * SaaS Auth Engine — Camada de lógica de autenticação (sem React).
 * Centraliza login, logout e estado do usuário; sessões gerenciadas pelo Supabase (localStorage).
 * Login via POST /api/login para aplicar rate limiting no Worker.
 */

import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/react-app/lib/supabase";
import { apiFetch } from "@/react-app/lib/api";

/** Usuário no contexto da aplicação (tipagem estrita para uso global). */
export interface UserContext {
  id: string;
  email: string | undefined;
}

function sessionToUserContext(session: Session | null): UserContext | null {
  if (!session?.user) return null;
  const u: User = session.user;
  return { id: u.id, email: u.email ?? undefined };
}

/** Resposta de sucesso do POST /api/login (proxy Supabase Auth). */
interface LoginApiData {
  access_token: string;
  refresh_token: string;
  user?: { id: string; email?: string };
}

/**
 * Login com email e senha via POST /api/login (rate limit no Worker).
 * Define a sessão no Supabase (localStorage) com os tokens retornados.
 */
export async function login(email: string, password: string): Promise<{ user: UserContext }> {
  const data = await apiFetch<LoginApiData>("/api/login", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), password }),
  });
  if (!data.access_token) throw new Error("Resposta de login inválida");
  await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? "",
  });
  const user: UserContext = {
    id: data.user?.id ?? "",
    email: data.user?.email,
  };
  if (!user.id) {
    const session = await getSession();
    return { user: sessionToUserContext(session)! };
  }
  return { user };
}

/**
 * Encerra a sessão atual (limpa localStorage do Supabase).
 */
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Retorna o usuário atual a partir da sessão Supabase (sem reatividade).
 */
export async function getCurrentUser(): Promise<UserContext | null> {
  const { data } = await supabase.auth.getSession();
  return sessionToUserContext(data.session);
}

/**
 * Retorna a sessão bruta (para token e listeners). Uso interno e AdminGuard.
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Access token (JWT) para o header Authorization nas chamadas à API admin.
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}
