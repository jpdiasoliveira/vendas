/**
 * Repositório: produtos e estoque. Todas as queries filtram por store_id (multi-tenant).
 */

import { getSupabase } from "../supabase.js";
import type { CartItemPayload, Product } from "../schema.js";
import { rowToProduct } from "./mappers.js";
import { OrderBusinessError } from "../orderErrors.js";

/**
 * Colunas explícitas de `products` + embed só `categories(name)`.
 * Evita `*` com resource embutido (PostgREST pode inferir colunas erradas na relação) e não pede nada em `categories` além do nome.
 */
const PRODUCT_SELECT_WITH_CATEGORY =
  "id, store_id, category_id, name, slug, description, price, price_wholesale, min_quantity_wholesale, stock, status, image_url, metadata, created_at, updated_at, categories(name)";

/** Total de SKUs da loja (para enforcement de `max_products`). */
export async function countProductsByStore(env: Env, storeId: string): Promise<number> {
  const supabase = getSupabase(env);
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getProductsByStore(env: Env, storeId: string): Promise<Product[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT_WITH_CATEGORY)
    .eq("store_id", storeId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (rows ?? []).map((r) => rowToProduct(r as Record<string, unknown>));
}

export async function getProductById(
  env: Env,
  productId: string,
  storeId: string
): Promise<Product | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT_WITH_CATEGORY)
    .eq("id", productId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return row ? rowToProduct(row as Record<string, unknown>) : null;
}

export async function getTrendingProductIds(env: Env, storeId: string): Promise<string[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("view_top_sellers")
    .select("product_id")
    .eq("store_id", storeId);
  if (error) {
    console.error("[getTrendingProductIds]", error.message);
    return [];
  }
  if (!rows || rows.length === 0) return [];
  const ids = rows
    .map((r) => r.product_id as string)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  return [...new Set(ids)];
}

export interface ProductCreatePayload {
  name: string;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
  categoryId?: string | null;
  stock?: number | null;
  status?: string | null;
  priceWholesale?: number | null;
  minQuantityWholesale?: number | null;
}

async function assertCategoryIdForStore(
  env: Env,
  storeId: string,
  categoryId: string | null | undefined
): Promise<string | null> {
  if (categoryId == null || String(categoryId).trim() === "") return null;
  const supabase = getSupabase(env);
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Categoria inválida ou não pertence a esta loja.");
  return String(data.id);
}

export async function createProduct(
  env: Env,
  storeId: string,
  data: ProductCreatePayload
): Promise<Product> {
  const supabase = getSupabase(env);
  const stock = data.stock != null ? Number(Math.floor(data.stock)) : 0;
  const slug =
    data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") || "produto";
  const category_id = await assertCategoryIdForStore(env, storeId, data.categoryId);
  const payload: Record<string, unknown> = {
    store_id: storeId,
    name: data.name,
    price: Number(data.price),
    description: data.description ?? null,
    image_url: data.imageUrl ?? null,
    stock,
    status: data.status ?? "active",
    slug: slug + "-" + Date.now(),
    metadata: {},
  };
  if (category_id != null) payload.category_id = category_id;
  if (data.priceWholesale != null) payload.price_wholesale = Number(data.priceWholesale);
  if (data.minQuantityWholesale != null)
    payload.min_quantity_wholesale = Math.floor(Number(data.minQuantityWholesale));

  const { data: row, error } = await supabase
    .from("products")
    .insert(payload)
    .select(PRODUCT_SELECT_WITH_CATEGORY)
    .single();

  if (error) throw new Error(error.message);
  return rowToProduct(row as Record<string, unknown>);
}

export interface ProductUpdatePayload {
  price?: number;
  priceWholesale?: number | null;
  minQuantityWholesale?: number | null;
  stock?: number | null;
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  status?: string | null;
  /** Merge em metadata.featured_on_home (lê o JSON atual antes de gravar). */
  featuredOnHome?: boolean;
}

export async function updateProduct(
  env: Env,
  productId: string,
  storeId: string,
  data: ProductUpdatePayload
): Promise<void> {
  const supabase = getSupabase(env);
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.price !== undefined) payload.price = data.price;
  if (data.priceWholesale !== undefined) payload.price_wholesale = data.priceWholesale;
  if (data.minQuantityWholesale !== undefined) payload.min_quantity_wholesale = data.minQuantityWholesale;
  if (data.stock !== undefined) payload.stock = data.stock;
  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.imageUrl !== undefined) payload.image_url = data.imageUrl;
  if (data.status !== undefined) payload.status = data.status ?? "active";
  if (data.featuredOnHome !== undefined) {
    const current = await getProductById(env, productId, storeId);
    const prev =
      current?.metadata && typeof current.metadata === "object" && !Array.isArray(current.metadata)
        ? { ...current.metadata }
        : {};
    payload.metadata = { ...prev, featured_on_home: data.featuredOnHome };
  }

  const { error } = await supabase
    .from("products")
    .update(payload)
    .match({ id: productId, store_id: storeId });

  if (error) throw new Error(error.message);
}

export async function getProductStock(
  env: Env,
  productId: string,
  storeId: string
): Promise<number | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("products")
    .select("stock")
    .eq("id", productId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) return null;
  if (row == null) return null;
  return row.stock != null ? Number(row.stock) : 0;
}

export async function validateOrderStock(
  env: Env,
  storeId: string,
  items: CartItemPayload[]
): Promise<void> {
  for (const item of items) {
    const available = await getProductStock(env, item.id, storeId);
    const required = item.quantity;
    const name = item.name?.trim() || "Produto";
    if (available === null || available < required) {
      throw new Error(`Estoque insuficiente para o item: ${name}`);
    }
  }
}

/** Linha do pedido com preço unitário vindo do catálogo (não confiar no preço enviado pelo cliente). */
export type ResolvedCheckoutLine = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  image?: string | null;
};

/**
 * Resolve itens, estoque e preços a partir do catálogo. Falha se preço do cliente divergir do servidor.
 */
export async function resolveOrderLinesForCheckout(
  env: Env,
  storeId: string,
  items: CartItemPayload[]
): Promise<ResolvedCheckoutLine[]> {
  const lines: ResolvedCheckoutLine[] = [];
  for (const item of items) {
    const p = await getProductById(env, item.id, storeId);
    const label = item.name?.trim() || "Produto";
    if (!p) {
      throw new OrderBusinessError(`Produto não encontrado: ${label}`);
    }
    const required = Math.floor(Number(item.quantity));
    if (!Number.isFinite(required) || required <= 0) {
      throw new OrderBusinessError(`Quantidade inválida para: ${p.name || label}`);
    }
    const stock = p.stock ?? 0;
    if (stock < required) {
      throw new Error(`Estoque insuficiente para o item: ${p.name || label}`);
    }
    const unit = Number(p.price);
    const clientUnit = Number(item.price);
    if (Number.isFinite(clientUnit) && Math.abs(clientUnit - unit) > 0.02) {
      throw new OrderBusinessError(
        "Os preços do carrinho mudaram. Atualize a página e tente novamente."
      );
    }
    lines.push({
      id: item.id,
      name: (p.name || item.name || "Produto").trim() || "Produto",
      quantity: required,
      unitPrice: unit,
      image: p.imageUrl ?? item.image ?? item.imageUrl ?? null,
    });
  }
  return lines;
}

export async function deleteProduct(env: Env, productId: string, storeId: string): Promise<void> {
  const supabase = getSupabase(env);
  const { error } = await supabase
    .from("products")
    .delete()
    .match({ id: productId, store_id: storeId });
  if (error) throw new Error(error.message);
}
