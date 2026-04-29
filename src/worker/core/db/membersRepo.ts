/**
 * Repositório: vínculo usuário ↔ loja (store_members). Sempre filtra store_id + user_id.
 */

import { getSupabase } from "../supabase.js";
import type { StoreMember } from "../schema.js";

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
