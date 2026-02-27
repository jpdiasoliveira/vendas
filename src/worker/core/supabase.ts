import { createClient } from '@supabase/supabase-js';

/**
 * Instancia e retorna o cliente do Supabase para o banco de dados principal (PostgreSQL).
 * Utiliza o Service Role Key seguro para ignorar RLS nas transações backend automatizadas.
 * 
 * @param {Env} env - As configurações e secrets ambientais injetadas pelo Cloudflare Workers (C).
 * @returns {import('@supabase/supabase-js').SupabaseClient} O manipulador oficial para query builders do Supabase.
 */
export const getSupabase = (env: Env) => {
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
};
