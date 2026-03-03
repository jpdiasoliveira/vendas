/**
 * Cliente Supabase do frontend (Auth com anon key).
 * Sessões persistidas em localStorage. Usado pelo AuthContext e auth.service.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const hasConfig = url && anonKey;

if (!hasConfig) {
  console.warn(
    "[services.supabase] VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidos para o login do painel admin."
  );
}

export const supabase: SupabaseClient = hasConfig
  ? createClient(url, anonKey)
  : createClient(
      "https://placeholder.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDB9.placeholder"
    );
