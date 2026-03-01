import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const hasConfig = url && anonKey;

if (!hasConfig) {
  console.warn(
    "VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidos para o login do painel admin."
  );
}

/**
 * Cliente Supabase para o frontend (Auth com anon key).
 * Sessões são persistidas em localStorage (padrão do Supabase).
 * Se as env vars não estiverem definidas, usa URL/chave placeholder para evitar crash; o login falhará até configurar.
 */
export const supabase: SupabaseClient = hasConfig
  ? createClient(url, anonKey)
  : createClient(
      "https://placeholder.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDB9.placeholder"
    );
