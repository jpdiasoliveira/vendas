/**
 * Repositório: categorias do catálogo por loja (store_id obrigatório).
 */

import { getSupabase } from "../supabase.js";
import type { Category } from "../schema.js";
import { rowToCategory } from "./mappers.js";

export async function getCategoriesByStore(env: Env, storeId: string): Promise<Category[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("categories")
    .select("id, store_id, name, slug, sort_order, created_at, updated_at, metadata")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (rows ?? []).map((r) => rowToCategory(r as Record<string, unknown>));
}
