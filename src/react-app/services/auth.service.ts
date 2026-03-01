/**
 * SaaS Auth Engine — Camada de lógica de autenticação (sem React).
 * Centraliza login, logout e estado do usuário; sessões gerenciadas pelo Supabase (localStorage).
 */

import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/react-app/lib/supabase";

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

/**
 * Login com email e senha. Dispara atualização de sessão no Supabase (persistida em localStorage).
 */
export async function login(email: string, password: string): Promise<{ user: UserContext }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  const user = sessionToUserContext(data.session);
  if (!user) throw new Error("Sessão inválida");
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
