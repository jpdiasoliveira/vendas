/**
 * Repositório: vínculo usuário ↔ loja (store_members). Sempre filtra store_id + user_id.
 */

import { getSupabase } from "../supabase.js";
import type { StoreMember } from "../schema.js";

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
