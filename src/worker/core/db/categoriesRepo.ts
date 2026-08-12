/**
 * Repositório: categorias do catálogo por loja (store_id obrigatório).
 */

import { getSupabase } from "../supabase.js";
import type { Category } from "../../../contracts/schema.js";
import { rowToCategory } from "./mappers.js";

const CATEGORY_SELECT = "id, store_id, name, slug, sort_order, created_at, updated_at";

function slugFromName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return base || "categoria";
}

export async function getCategoriesByStore(env: Env, storeId: string): Promise<Category[]> {
  try {
    const supabase = getSupabase(env);
    const { data: rows, error } = await supabase
      .from("categories")
      .select(CATEGORY_SELECT)
      .eq("store_id", storeId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (!error && rows) {
      return rows.map((r) => rowToCategory(r as Record<string, unknown>));
    }
  } catch (e) {
    console.warn("[getCategoriesByStore] Supabase query failed:", e);
  }
  return [];
}

export async function getCategoryByIdAndStore(
  env: Env,
  categoryId: string,
  storeId: string
): Promise<Category | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("id", categoryId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return row ? rowToCategory(row as Record<string, unknown>) : null;
}

export async function createCategory(
  env: Env,
  storeId: string,
  params: { name: string; slug?: string | null; sortOrder?: number | null }
): Promise<Category> {
  const supabase = getSupabase(env);
  const nameTrim = params.name.trim();
  const rawSlug = params.slug?.trim();
  const baseSlug = rawSlug && rawSlug.length > 0 ? slugFromName(rawSlug) : slugFromName(nameTrim);
  const slug = `${baseSlug}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

  const { data: row, error } = await supabase
    .from("categories")
    .insert({
      store_id: storeId,
      name: nameTrim,
      slug,
      sort_order: params.sortOrder != null ? Math.floor(Number(params.sortOrder)) : 0,
    })
    .select(CATEGORY_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return rowToCategory(row as Record<string, unknown>);
}

export async function updateCategory(
  env: Env,
  categoryId: string,
  storeId: string,
  params: { name?: string; slug?: string | null; sortOrder?: number | null }
): Promise<Category> {
  const existing = await getCategoryByIdAndStore(env, categoryId, storeId);
  if (!existing) throw new Error("Categoria não encontrada.");

  const supabase = getSupabase(env);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (params.name !== undefined) patch.name = params.name.trim();
  if (params.sortOrder !== undefined) {
    patch.sort_order = params.sortOrder == null ? 0 : Math.floor(Number(params.sortOrder));
  }
  if (params.slug !== undefined) {
    const t = params.slug?.trim();
    patch.slug =
      t && t.length > 0
        ? `${slugFromName(t)}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
        : null;
  }

  const { data: row, error } = await supabase
    .from("categories")
    .update(patch)
    .eq("id", categoryId)
    .eq("store_id", storeId)
    .select(CATEGORY_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return rowToCategory(row as Record<string, unknown>);
}

export async function deleteCategory(env: Env, categoryId: string, storeId: string): Promise<void> {
  const supabase = getSupabase(env);
  const { error } = await supabase.from("categories").delete().eq("id", categoryId).eq("store_id", storeId);
  if (error) throw new Error(error.message);
}
