/**
 * Camada de dados (Repository Pattern).
 * Isola chamadas ao Supabase; mapeia snake_case (DB) <-> camelCase (código).
 * Trocar o banco no futuro não exige alterar as rotas.
 */

import { getSupabase } from "./supabase.js";
import type {
  Product,
  Order,
  OrderItem,
  CartItemPayload,
  OrderDetail,
  Store,
  StoreSettings,
  Category,
} from "./schema.js";
import type { AuditLogReport } from "../../shared/types.js";

// ---- Mapeadores: Supabase (snake_case) -> Schema (camelCase) ----

function categoryNameFromJoinedRow(row: Record<string, unknown>): string | undefined {
  const raw = row.categories;
  if (raw == null || typeof raw !== "object") return undefined;
  if (Array.isArray(raw)) {
    const first = raw[0] as { name?: unknown } | undefined;
    return typeof first?.name === "string" ? first.name : undefined;
  }
  const n = (raw as { name?: unknown }).name;
  return typeof n === "string" ? n : undefined;
}

function rowToProduct(row: Record<string, unknown>): Product {
  const price = Number(row.price);
  const priceWholesale = row.price_wholesale != null ? Number(row.price_wholesale) : undefined;
  const minQty = row.min_quantity_wholesale != null ? Number(row.min_quantity_wholesale) : undefined;
  const joinedName = categoryNameFromJoinedRow(row);
  return {
    id: row.id as string,
    storeId: row.store_id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? undefined,
    price,
    priceWholesale: priceWholesale ?? undefined,
    minQuantityWholesale: minQty ?? undefined,
    imageUrl: (row.image_url as string | null) ?? undefined,
    categoryId: row.category_id != null ? String(row.category_id) : undefined,
    category: joinedName ?? (row.category as string | null) ?? undefined,
    stock: row.stock != null ? Number(row.stock) : undefined,
    status: (row.status as string | null) ?? undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

function rowToOrder(row: Record<string, unknown>): Order {
  const addr = Array.isArray(row.delivery_addresses) && row.delivery_addresses[0]
    ? (row.delivery_addresses[0] as { city?: string; state_code?: string })
    : null;
  const statusVal = (row.status ?? row.payment_status) as string | null | undefined;
  return {
    id: row.id != null ? String(row.id) : "",
    storeId: row.store_id as string,
    userId: row.user_id as string,
    customerName: (row.customer_name as string | null) ?? undefined,
    customerPhone: (row.customer_phone as string | null) ?? undefined,
    status: statusVal ?? "pending",
    total: Number(row.total),
    paymentMethod: (row.payment_method as string | null) ?? undefined,
    paymentStatus: statusVal ?? undefined,
    deliveryAddress: (row.delivery_address as string | null) ?? undefined,
    shippingCity: (row.shipping_city as string | null) ?? addr?.city ?? undefined,
    shippingState: (row.shipping_state as string | null) ?? addr?.state_code ?? undefined,
    trackingCode: (row.tracking_code as string | null) ?? undefined,
    shippingMethod: (row.shipping_method as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string | undefined,
  };
}

function rowToOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    id: row.id != null ? Number(row.id) : undefined,
    orderId: row.order_id != null ? String(row.order_id) : "",
    storeId: row.store_id as string,
    productId: row.product_id as string,
    productName: row.product_name as string,
    productImage: (row.product_image as string | null) ?? undefined,
    quantity: Number(row.quantity),
    price: Number(row.price),
  };
}

function rowToStore(row: Record<string, unknown>): Store {
  return {
    id: row.id as string,
    slug: row.slug as string,
    displayName: row.display_name as string,
    status: row.status as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---- Store (Supabase: coluna status, não is_active) ----

/**
 * Busca loja por slug no Supabase. Apenas lojas com status = 'active'.
 */
export async function getStoreBySlug(env: Env, slug: string): Promise<Store | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) return null;

  return rowToStore(row);
}

// ---- Store settings ----

/**
 * Retorna configurações da loja (store_settings + display_name de stores).
 * Se não existir linha em store_settings, retorna display_name da store e demais campos null/0.
 */
export async function getStoreSettingsWithDisplayName(
  env: Env,
  storeId: string
): Promise<StoreSettings> {
  const supabase = getSupabase(env);
  const { data: storeRow, error: storeError } = await supabase
    .from("stores")
    .select("display_name")
    .eq("id", storeId)
    .maybeSingle();
  if (storeError) throw new Error(storeError.message);

  const { data: settingsRow, error: settingsError } = await supabase
    .from("store_settings")
    .select("logo_url, primary_color, minimum_order_value")
    .eq("store_id", storeId)
    .maybeSingle();
  if (settingsError) throw new Error(settingsError.message);

  return {
    displayName: (storeRow?.display_name as string) ?? "",
    logoUrl: settingsRow?.logo_url ?? null,
    primaryColor: settingsRow?.primary_color ?? null,
    minimumOrderValue:
      settingsRow?.minimum_order_value != null ? Number(settingsRow.minimum_order_value) : null,
  };
}

/**
 * Atualiza store_settings (logo_url, primary_color, minimum_order_value) e stores.display_name.
 * Faz upsert em store_settings se não existir linha para o store_id.
 */
export async function updateStoreSettingsAndDisplayName(
  env: Env,
  storeId: string,
  payload: {
    displayName?: string | null;
    logoUrl?: string | null;
    primaryColor?: string | null;
    minimumOrderValue?: number | null;
  }
): Promise<void> {
  const supabase = getSupabase(env);
  if (payload.displayName !== undefined) {
    const { error: storeErr } = await supabase
      .from("stores")
      .update({
        display_name: payload.displayName ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);
    if (storeErr) throw new Error(storeErr.message);
  }
  if (
    payload.logoUrl !== undefined ||
    payload.primaryColor !== undefined ||
    payload.minimumOrderValue !== undefined
  ) {
    const { data: existing } = await supabase
      .from("store_settings")
      .select("store_id")
      .eq("store_id", storeId)
      .maybeSingle();
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.logoUrl !== undefined) updatePayload.logo_url = payload.logoUrl ?? null;
    if (payload.primaryColor !== undefined) updatePayload.primary_color = payload.primaryColor ?? null;
    if (payload.minimumOrderValue !== undefined)
      updatePayload.minimum_order_value = payload.minimumOrderValue ?? null;

    if (existing) {
      const { error: updErr } = await supabase
        .from("store_settings")
        .update(updatePayload)
        .eq("store_id", storeId);
      if (updErr) throw new Error(updErr.message);
    } else {
      const { error: insErr } = await supabase.from("store_settings").insert({
        store_id: storeId,
        logo_url: payload.logoUrl ?? null,
        primary_color: payload.primaryColor ?? null,
        minimum_order_value: payload.minimumOrderValue ?? null,
        updated_at: new Date().toISOString(),
      });
      if (insErr) throw new Error(insErr.message);
    }
  }
}

// ---- Categorias ----

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    storeId: row.store_id as string,
    name: row.name as string,
    slug: (row.slug as string | null) ?? undefined,
    createdAt: row.created_at as string | undefined,
  };
}

export async function getCategoriesByStore(env: Env, storeId: string): Promise<Category[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("categories")
    .select("id, store_id, name, slug, created_at")
    .eq("store_id", storeId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (rows ?? []).map((r) => rowToCategory(r as Record<string, unknown>));
}

// ---- Produtos ----

const PRODUCT_SELECT_WITH_CATEGORY = "*, categories(name)";

export async function getProductsByStore(env: Env, storeId: string): Promise<Product[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT_WITH_CATEGORY)
    .eq("store_id", storeId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (rows ?? []).map(rowToProduct);
}

/** Retorna um produto por id e loja, ou null se não existir. */
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
  return row ? rowToProduct(row) : null;
}

/**
 * Retorna os product_id que aparecem na view view_top_sellers (top vendas, ex.: últimos 30 dias).
 * Se a view estiver vazia ou não existir, retorna array vazio (fallback: não exibir selo).
 */
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
  /** UUID em `categories` da mesma loja */
  categoryId?: string | null;
  stock?: number | null;
  status?: string | null;
  priceWholesale?: number | null;
  minQuantityWholesale?: number | null;
  unit?: string | null;
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

/**
 * Cria um produto na loja. store_id injetado pelo contexto; id gerado pelo banco (UUID).
 * Isolado por store_id (multi-tenant).
 */
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
  };
  if (category_id != null) payload.category_id = category_id;
  if (data.priceWholesale != null) payload.price_wholesale = Number(data.priceWholesale);
  if (data.minQuantityWholesale != null)
    payload.min_quantity_wholesale = Math.floor(Number(data.minQuantityWholesale));
  if (data.unit != null && String(data.unit).trim() !== "")
    payload.unit_type = String(data.unit).trim();

  const { data: row, error } = await supabase
    .from("products")
    .insert(payload)
    .select(PRODUCT_SELECT_WITH_CATEGORY)
    .single();

  if (error) throw new Error(error.message);
  return rowToProduct(row);
}

export interface ProductUpdatePayload {
  price?: number;
  priceWholesale?: number | null;
  minQuantityWholesale?: number | null;
  stock?: number | null;
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  /** 'active' | 'inactive' — visibilidade no catálogo */
  status?: string | null;
}

/**
 * Atualiza campos de um produto. Isolado por store_id (multi-tenant).
 */
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

  const { error } = await supabase
    .from("products")
    .update(payload)
    .match({ id: productId, store_id: storeId });

  if (error) throw new Error(error.message);
}

/** Retorna o estoque atual do produto (null = produto não existe). Quando existe, stock null no banco é tratado como 0. */
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

/**
 * Valida se há estoque suficiente para todos os itens do pedido.
 * @throws Error com mensagem 'Estoque insuficiente para o item: [Nome]' se algum item estiver em falta.
 */
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

/**
 * Remove um produto. Isolado por store_id (multi-tenant).
 */
export async function deleteProduct(env: Env, productId: string, storeId: string): Promise<void> {
  const supabase = getSupabase(env);
  const { error } = await supabase
    .from("products")
    .delete()
    .match({ id: productId, store_id: storeId });
  if (error) throw new Error(error.message);
}

// ---- Pedidos ----

export async function createOrder(
  env: Env,
  params: {
    storeId: string;
    userId: string;
    items: CartItemPayload[];
    customerName?: string | null;
    customerPhone?: string | null;
    deliveryAddress?: string | null;
  }
): Promise<{ orderId: string; total: number }> {
  const supabase = getSupabase(env);
  const total = params.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const itemsJson = params.items.map((item) => ({
    product_id: item.id,
    name: item.name || "Produto",
    quantity: item.quantity,
    price: item.price,
  }));

  const orderPayload: Record<string, unknown> = {
    store_id: params.storeId,
    user_id: params.userId,
    total,
    payment_method: null,
    status: "pending",
    items: itemsJson,
  };
  if (params.customerName != null && String(params.customerName).trim() !== "")
    orderPayload.customer_name = String(params.customerName).trim();
  if (params.customerPhone != null && String(params.customerPhone).trim() !== "")
    orderPayload.customer_phone = String(params.customerPhone).trim();
  if (params.deliveryAddress != null && String(params.deliveryAddress).trim() !== "")
    orderPayload.delivery_address = String(params.deliveryAddress).trim();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(orderPayload)
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  const mappedItems = params.items.map((item) => ({
    order_id: order.id,
    store_id: params.storeId,
    product_id: item.id,
    product_name: item.name || "Produto",
    product_image: item.image ?? item.imageUrl ?? null,
    quantity: item.quantity,
    price: item.price,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(mappedItems);
  if (itemsError) throw new Error(itemsError.message);

  return { orderId: String(order.id), total };
}

export async function getOrderByIdAndStore(
  env: Env,
  orderId: string,
  userId: string,
  storeId: string
): Promise<Order | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .single();

  if (error || !row) return null;
  return rowToOrder(row);
}

export async function getOrdersByUserAndStore(
  env: Env,
  userId: string,
  storeId: string
): Promise<Order[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (rows ?? []).map(rowToOrder);
}

/**
 * Lista todos os pedidos da loja (para painel admin).
 * Inclui cidade/UF via join com delivery_addresses (se a relação existir) e tracking_code/shipping_method.
 */
export async function getAllOrdersByStore(env: Env, storeId: string): Promise<Order[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("orders")
    .select("*, delivery_addresses(city, state_code)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) {
    const fallback = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    if (fallback.error) throw new Error(fallback.error.message);
    return (fallback.data ?? []).map(rowToOrder);
  }
  return (rows ?? []).map(rowToOrder);
}

export async function getOrderItemsByOrderAndStore(
  env: Env,
  orderId: string,
  storeId: string
): Promise<OrderItem[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .eq("store_id", storeId);

  if (error) throw new Error(error.message);
  return (rows ?? []).map(rowToOrderItem);
}

/**
 * Retorna pedido completo com itens (join implícito: order + order_items com product_name).
 */
export async function getOrderWithItems(
  env: Env,
  orderId: string,
  storeId: string
): Promise<OrderDetail | null> {
  const order = await getOrderByIdForStore(env, orderId, storeId);
  if (!order) return null;
  const items = await getOrderItemsByOrderAndStore(env, orderId, storeId);
  return { ...order, items };
}

async function getOrderByIdForStore(
  env: Env,
  orderId: string,
  storeId: string
): Promise<Order | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("store_id", storeId)
    .single();
  if (error || !row) return null;
  return rowToOrder(row);
}

/** Retorna pedido apenas por id (usado pelo webhook). */
export async function getOrderById(env: Env, orderId: string): Promise<Order | null> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (error || !row) return null;
  return rowToOrder(row);
}

/**
 * Nomes corretos para a coluna orders.status (banco 100% em inglês).
 * Usar exatamente: 'pending' | 'paid' | 'shipped' | 'cancelled'
 * Atenção: cancelado no banco é 'cancelled' (dois L), não 'canceled'.
 */
const ORDER_STATUS_EN = ["pending", "paid", "shipped", "cancelled"] as const;

/** Mapeia PT ou variantes para o valor em inglês salvo no banco. Retorna null se inválido. */
export function normalizeOrderStatus(raw: string | null | undefined): (typeof ORDER_STATUS_EN)[number] | null {
  const s = raw?.trim()?.toLowerCase();
  if (!s) return null;
  const map: Record<string, (typeof ORDER_STATUS_EN)[number]> = {
    pendente: "pending",
    pending: "pending",
    pago: "paid",
    paid: "paid",
    approved: "paid",
    enviado: "shipped",
    shipped: "shipped",
    cancelado: "cancelled",
    cancelled: "cancelled",
    canceled: "cancelled",
  };
  const normalized = map[s];
  return normalized && ORDER_STATUS_EN.includes(normalized) ? normalized : null;
}

const PAID_STATUSES = ["paid", "approved"];

function isPaidStatus(s: string | null | undefined): boolean {
  return !!s && PAID_STATUSES.includes(s.toLowerCase());
}

/**
 * Baixa estoque: subtrai as quantidades dos itens do pedido dos produtos.
 * Chamado quando o pedido passa a status pago.
 * Produto inexistente ou stock null é tratado com segurança; falha em um item não interrompe os demais.
 */
export async function decreaseStockForOrder(
  env: Env,
  orderId: string,
  storeId: string
): Promise<void> {
  const items = await getOrderItemsByOrderAndStore(env, orderId, storeId);
  for (const item of items) {
    try {
      const current = await getProductStock(env, item.productId, storeId);
      if (current === null) {
        console.error("[decreaseStockForOrder] Produto não encontrado, pulando:", {
          orderId,
          productId: item.productId,
          storeId,
        });
        continue;
      }
      const newStock = Math.max(0, current - item.quantity);
      await updateProduct(env, item.productId, storeId, { stock: newStock });
    } catch (err) {
      console.error("[decreaseStockForOrder] Erro ao baixar estoque do item:", {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
    }
  }
}

/**
 * Estorno de estoque: devolve as quantidades dos itens ao estoque dos produtos.
 * Chamado quando um pedido pago é cancelado.
 * Produto inexistente ou stock null é tratado com segurança; falha em um item não interrompe os demais.
 */
export async function increaseStockForOrder(
  env: Env,
  orderId: string,
  storeId: string
): Promise<void> {
  const items = await getOrderItemsByOrderAndStore(env, orderId, storeId);
  for (const item of items) {
    try {
      const current = await getProductStock(env, item.productId, storeId);
      if (current === null) {
        console.error("[increaseStockForOrder] Produto não encontrado, pulando:", {
          orderId,
          productId: item.productId,
          storeId,
        });
        continue;
      }
      const newStock = current + item.quantity;
      await updateProduct(env, item.productId, storeId, { stock: newStock });
    } catch (err) {
      console.error("[increaseStockForOrder] Erro ao estornar estoque do item:", {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
    }
  }
}

/**
 * Atualiza o status do pedido (coluna status no banco). Garante isolamento por store_id.
 * Baixa/estorno de estoque em try/catch: se falhar, o status do pedido é atualizado mesmo assim.
 */
export async function updateOrderStatus(
  env: Env,
  orderId: string,
  storeId: string,
  newStatus: string
): Promise<void> {
  const idStr = String(orderId);
  const order = await getOrderByIdForStore(env, idStr, storeId);
  const oldStatus = order?.paymentStatus ?? order?.status ?? null;
  const statusLower = newStatus.trim().toLowerCase();
  const isCanceled = statusLower === "cancelled" || statusLower === "canceled";

  try {
    if (isPaidStatus(oldStatus) && isCanceled) {
      await increaseStockForOrder(env, idStr, storeId);
    } else if (isPaidStatus(newStatus) && !isPaidStatus(oldStatus)) {
      await decreaseStockForOrder(env, idStr, storeId);
    }
  } catch (stockErr) {
    console.error("[updateOrderStatus] Erro na atualização de estoque (status do pedido será atualizado mesmo assim):", {
      orderId: idStr,
      storeId,
      newStatus,
      oldStatus,
      error: stockErr instanceof Error ? stockErr.message : String(stockErr),
      stack: stockErr instanceof Error ? stockErr.stack : undefined,
    });
  }

  console.log("--- EXECUTANDO UPDATE ---", { id: idStr, status: newStatus });

  const supabase = getSupabase(env);
  const { error } = await supabase
    .from("orders")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .match({ id: idStr, store_id: storeId });
  if (error) throw new Error(error.message);
}

/**
 * Atualiza código de rastreio e método de envio do pedido.
 */
export async function updateOrderTracking(
  env: Env,
  orderId: string,
  storeId: string,
  payload: { trackingCode?: string | null; shippingMethod?: string | null }
): Promise<void> {
  const supabase = getSupabase(env);
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.trackingCode !== undefined) update.tracking_code = payload.trackingCode ?? null;
  if (payload.shippingMethod !== undefined) update.shipping_method = payload.shippingMethod ?? null;
  const { error } = await supabase
    .from("orders")
    .update(update)
    .match({ id: orderId, store_id: storeId });
  if (error) throw new Error(error.message);
}

export async function updateOrderPayment(
  env: Env,
  orderId: string,
  storeId: string,
  paymentMethod: string,
  options?: { paymentId?: number; paymentStatus?: string }
): Promise<void> {
  const supabase = getSupabase(env);
  const payload: Record<string, unknown> = {
    payment_method: paymentMethod,
    status: options?.paymentStatus ?? "pending",
    updated_at: new Date().toISOString(),
  };
  if (options?.paymentId != null) {
    payload.payment_id = String(options.paymentId);
  }
  const { error } = await supabase
    .from("orders")
    .update(payload)
    .match({ id: String(orderId), store_id: storeId });

  if (error) throw new Error(error.message);
}

/**
 * Atualiza o status do pedido (coluna status; usado pelo webhook do Mercado Pago).
 * Baixa de estoque em try/catch: se falhar, o status é atualizado mesmo assim.
 */
export async function updateOrderPaymentStatus(
  env: Env,
  orderId: string,
  status: string,
  _paymentInfo?: { paymentId?: number } // reservado para uso futuro (ex.: payment_id)
): Promise<void> {
  void _paymentInfo;
  const idStr = String(orderId);
  const order = await getOrderById(env, idStr);
  try {
    if (order && isPaidStatus(status) && !isPaidStatus(order.paymentStatus ?? order.status)) {
      await decreaseStockForOrder(env, idStr, order.storeId);
    }
  } catch (stockErr) {
    console.error("[updateOrderPaymentStatus] Erro na baixa de estoque (status será atualizado):", {
      orderId: idStr,
      error: stockErr instanceof Error ? stockErr.message : String(stockErr),
    });
  }

  const supabase = getSupabase(env);
  const { error } = await supabase
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", idStr);

  if (error) throw new Error(error.message);
}

// ---- Store members (SaaS auth) ----

export interface StoreMember {
  id: string;
  userId: string;
  storeId: string;
  role: string;
}

/**
 * Verifica se o usuário é membro da loja (store_members).
 * Usado pelo authMiddleware para autorizar acesso ao painel admin.
 */
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

/** Registro da view view_audit_report. */
export interface AuditReportRow {
  id: string;
  store_id: string;
  user_id: string;
  action: string;
  action_key: string;
  resource_type: string;
  resource_id: string;
  nome_recurso: string;
  details: Record<string, unknown> | null;
  created_at: string;
  user_email: string | null;
}

/**
 * Lista logs de auditoria da loja (view view_audit_report). Ordenado por created_at DESC.
 */
export async function getAuditLogsByStore(env: Env, storeId: string): Promise<AuditReportRow[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("view_audit_report")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (rows ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    store_id: row.store_id as string,
    user_id: row.user_id as string,
    action: row.action as string,
    action_key: (row.action_key as string) ?? (row.action as string),
    resource_type: row.resource_type as string,
    resource_id: row.resource_id as string,
    nome_recurso: (row.nome_recurso as string) ?? "",
    details: row.details as Record<string, unknown> | null,
    created_at: row.created_at as string,
    user_email: (row.user_email as string | null) ?? null,
  }));
}

const ACTION_LABELS: Record<string, string> = {
  CREATE_PRODUCT: "Criar produto",
  UPDATE_PRODUCT: "Atualizar produto",
  DELETE_PRODUCT: "Excluir produto",
  UPDATE_ORDER_STATUS: "Atualizar status do pedido",
};

export interface GetAuditLogsOptions {
  search?: string;
  action?: string;
}

/**
 * Busca os logs de auditoria formatados da View para uma loja específica.
 * Filtros opcionais: search (ilike em nome_recurso), action (eq em action_key).
 * Retorna no contrato AuditLogReport (shared), limit 50.
 */
export async function getAuditLogs(
  env: Env,
  storeId: string,
  options?: GetAuditLogsOptions
): Promise<AuditLogReport[]> {
  const supabase = getSupabase(env);
  let query = supabase
    .from("view_audit_report")
    .select("*")
    .eq("store_id", storeId);

  const search = options?.search?.trim();
  if (search) {
    query = query.ilike("nome_recurso", `%${search}%`);
  }
  if (options?.action?.trim()) {
    query = query.eq("action_key", options.action.trim());
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as AuditReportRow[];
  return rows.map((row) => ({
    id: row.id,
    data_hora: row.created_at,
    usuario_email: row.user_email ?? "",
    acao_descricao: ACTION_LABELS[row.action] ?? row.action,
    action_key: row.action,
    tipo: row.resource_type,
    nome_recurso: row.nome_recurso ?? `${row.resource_type} #${row.resource_id}`,
    resource_id: row.resource_id,
    detalhes: row.details ?? {},
  }));
}
