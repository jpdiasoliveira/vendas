/**
 * Sessão Supabase sem dependência de api.ts (evita ciclo de import com o cliente HTTP).
 */
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/react-app/services/supabase";

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}
