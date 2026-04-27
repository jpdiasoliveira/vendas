import { createClient } from '@supabase/supabase-js';

/**
 * Instancia e retorna o cliente do Supabase para o banco de dados principal (PostgreSQL).
 * Utiliza a Service Role Key (bypass de RLS). O isolamento por loja continua no Worker;
 * políticas RLS no Postgres protegem acessos diretos com JWT anon/authenticated.
 * 
 * @param {Env} env - As configurações e secrets ambientais injetadas pelo Cloudflare Workers (C).
 * @returns {import('@supabase/supabase-js').SupabaseClient} O manipulador oficial para query builders do Supabase.
 */
export const getSupabase = (env: Env) => {
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
};
