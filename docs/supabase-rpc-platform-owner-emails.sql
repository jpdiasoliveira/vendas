-- E-mails dos donos por loja para a Central da Plataforma (evita N× getUserById no Worker).
-- Executar no SQL Editor do Supabase (projeto com store_members + auth.users).
-- Ajuste grants conforme a política do projeto; o Worker usa service_role.

create or replace function public.platform_owner_emails_for_store_ids(p_store_ids uuid[])
  returns table (store_id uuid, owner_email text)
  language sql
  security definer
  set search_path = public, auth
as $$
  select distinct on (sm.store_id)
    sm.store_id,
    coalesce(au.email::text, '') as owner_email
  from public.store_members sm
  join auth.users au on au.id = sm.user_id
  where sm.role = 'owner'
    and sm.store_id = any(p_store_ids)
  order by sm.store_id, sm.created_at asc nulls last;
$$;

revoke all on function public.platform_owner_emails_for_store_ids(uuid[]) from public;
grant execute on function public.platform_owner_emails_for_store_ids(uuid[]) to service_role;
