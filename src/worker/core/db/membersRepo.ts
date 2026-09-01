/**
 * Repositório: vínculo usuário ↔ loja (store_members). Sempre filtra store_id + user_id.
 */

import { getSupabase } from "../supabase.js";
import type { StoreMember } from "../../../contracts/schema.js";

/** Loja ativa em que o utilizador tem papel de equipa (painel admin). */
export type StaffStoreMembershipDto = {
  storeId: string;
  slug: string;
  role: string;
};

/**
 * Lista lojas ativas em que o utilizador é membro (owner/admin/staff).
 * Duas queries explícitas: evita ambiguidade de embed PostgREST e mantém o contrato estável.
 */
export async function listActiveStoreMembershipsForUser(
  env: Env,
  userId: string
): Promise<StaffStoreMembershipDto[]> {
  const supabase = getSupabase(env);
  const { data: members, error: mErr } = await supabase
    .from("store_members")
    .select("store_id, role")
    .eq("user_id", userId);
  if (mErr) throw new Error(mErr.message);
  if (!members?.length) return [];

  const storeIds = [...new Set(members.map((m) => String((m as { store_id: unknown }).store_id)))];
  const { data: stores, error: sErr } = await supabase.from("stores").select("id, slug, status").in("id", storeIds);
  if (sErr) throw new Error(sErr.message);

  const byId = new Map(
    (stores ?? []).map((row) => {
      const r = row as { id: unknown; slug: unknown; status: unknown };
      return [String(r.id), r] as const;
    })
  );

  const out: StaffStoreMembershipDto[] = [];
  for (const m of members) {
    const row = m as { store_id: unknown; role: unknown };
    const sid = String(row.store_id);
    const s = byId.get(sid);
    if (!s) continue;
    if (String(s.status ?? "").toLowerCase() !== "active") continue;
    const slug = typeof s.slug === "string" ? s.slug.trim() : "";
    if (!slug) continue;
    out.push({
      storeId: sid,
      slug,
      role: typeof row.role === "string" && row.role.trim() ? row.role.trim() : "staff",
    });
  }
  return out;
}

export async function getStoreMember(
  env: Env,
  userId: string,
  storeId: string
): Promise<StoreMember | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("store_members")
    .select("id, user_id, store_id, role")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) return null;

  return {
    id: row.id as string,
    userId: row.user_id as string,
    storeId: row.store_id as string,
    role: row.role as string,
  };
}

export type StoreMemberRow = {
  id: string;
  userId: string;
  storeId: string;
  role: string;
  createdAt: string;
};

function mapMemberRow(row: {
  id: unknown;
  user_id: unknown;
  store_id: unknown;
  role: unknown;
  created_at?: unknown;
}): StoreMemberRow {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    storeId: String(row.store_id),
    role: typeof row.role === "string" && row.role.trim() ? row.role.trim() : "staff",
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

const memberRoleRank = (role: string) => {
  const r = role.trim().toLowerCase();
  if (r === "owner") return 0;
  if (r === "admin") return 1;
  return 2;
};

export async function listMembersByStore(env: Env, storeId: string): Promise<StoreMemberRow[]> {
  const supabase = getSupabase(env);
  const { data, error } = await supabase
    .from("store_members")
    .select("id, user_id, store_id, role, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map((row) => mapMemberRow(row as Parameters<typeof mapMemberRow>[0]));
  return rows.sort((a, b) => {
    const rank = memberRoleRank(a.role) - memberRoleRank(b.role);
    if (rank !== 0) return rank;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export async function countStaffAndAdminMembersByStore(env: Env, storeId: string): Promise<number> {
  const supabase = getSupabase(env);
  const { count, error } = await supabase
    .from("store_members")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .in("role", ["staff", "admin"]);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function countOwnersByStore(env: Env, storeId: string): Promise<number> {
  const supabase = getSupabase(env);
  const { count, error } = await supabase
    .from("store_members")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .eq("role", "owner");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getMemberByIdAndStore(
  env: Env,
  memberId: string,
  storeId: string,
): Promise<StoreMemberRow | null> {
  const supabase = getSupabase(env);
  const { data, error } = await supabase
    .from("store_members")
    .select("id, user_id, store_id, role, created_at")
    .eq("id", memberId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapMemberRow(data as Parameters<typeof mapMemberRow>[0]);
}

export async function getMemberByUserAndStore(
  env: Env,
  userId: string,
  storeId: string,
): Promise<StoreMemberRow | null> {
  const supabase = getSupabase(env);
  const { data, error } = await supabase
    .from("store_members")
    .select("id, user_id, store_id, role, created_at")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapMemberRow(data as Parameters<typeof mapMemberRow>[0]);
}

export async function insertStoreMember(
  env: Env,
  storeId: string,
  userId: string,
  role: string,
): Promise<StoreMemberRow> {
  const supabase = getSupabase(env);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("store_members")
    .insert({
      store_id: storeId,
      user_id: userId,
      role,
      created_at: now,
      updated_at: now,
    })
    .select("id, user_id, store_id, role, created_at")
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("Este usuário já faz parte da equipe.");
    throw new Error(error.message);
  }
  return mapMemberRow(data as Parameters<typeof mapMemberRow>[0]);
}

export async function updateStoreMemberRole(
  env: Env,
  memberId: string,
  storeId: string,
  role: string,
): Promise<StoreMemberRow> {
  const supabase = getSupabase(env);
  const { data, error } = await supabase
    .from("store_members")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", memberId)
    .eq("store_id", storeId)
    .select("id, user_id, store_id, role, created_at")
    .single();
  if (error) throw new Error(error.message);
  return mapMemberRow(data as Parameters<typeof mapMemberRow>[0]);
}

export async function deleteStoreMember(env: Env, memberId: string, storeId: string): Promise<void> {
  const supabase = getSupabase(env);
  const { error } = await supabase.from("store_members").delete().eq("id", memberId).eq("store_id", storeId);
  if (error) throw new Error(error.message);
}
