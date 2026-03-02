/**
 * Camada de dados (Repository Pattern).
 * Isola chamadas ao Supabase; mapeia snake_case (DB) <-> camelCase (código).
 * Trocar o banco no futuro não exige alterar as rotas.
 */

import { getSupabase } from "./supabase.js";
import type { Product, Order, OrderItem, CartItemPayload, OrderDetail, Store } from "./schema.js";

// ---- Mapeadores: Supabase (snake_case) -> Schema (camelCase) ----

function rowToProduct(row: Record<string, unknown>): Product {
  const price = Number(row.price);
  const priceWholesale = row.price_wholesale != null ? Number(row.price_wholesale) : undefined;
  const minQty = row.min_quantity_wholesale != null ? Number(row.min_quantity_wholesale) : undefined;
  return {
    id: row.id as string,
    storeId: row.store_id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? undefined,
    price,
    priceWholesale: priceWholesale ?? undefined,
    minQuantityWholesale: minQty ?? undefined,
    imageUrl: (row.image_url as string | null) ?? undefined,
    category: (row.category as string | null) ?? undefined,
    stock: row.stock != null ? Number(row.stock) : undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

function rowToOrder(row: Record<string, unknown>): Order {
  return {
    id: Number(row.id),
    storeId: row.store_id as string,
    userId: row.user_id as string,
    customerName: (row.customer_name as string | null) ?? undefined,
    status: row.status as string,
    total: Number(row.total),
    paymentMethod: (row.payment_method as string | null) ?? undefined,
    paymentStatus: (row.payment_status as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string | undefined,
  };
}

function rowToOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    id: row.id != null ? Number(row.id) : undefined,
    orderId: Number(row.order_id),
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

// ---- Produtos ----

export async function getProductsByStore(env: Env, storeId: string): Promise<Product[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (rows ?? []).map(rowToProduct);
}

export interface ProductCreatePayload {
  name: string;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
}

/**
 * Cria um produto na loja. Isolado por store_id (multi-tenant).
 */
export async function createProduct(
  env: Env,
  storeId: string,
  data: ProductCreatePayload
): Promise<Product> {
  const supabase = getSupabase(env);
  const { data: row, error } = await supabase
    .from("products")
    .insert({
      store_id: storeId,
      name: data.name,
      price: data.price,
      description: data.description ?? null,
      image_url: data.imageUrl ?? null,
    })
    .select()
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

  const { error } = await supabase
    .from("products")
    .update(payload)
    .match({ id: productId, store_id: storeId });

  if (error) throw new Error(error.message);
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
  params: { storeId: string; userId: string; items: CartItemPayload[] }
): Promise<{ orderId: number; total: number }> {
  const supabase = getSupabase(env);
  const total = params.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      store_id: params.storeId,
      user_id: params.userId,
      total,
      payment_method: null,
      status: "pending",
    })
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

  return { orderId: order.id, total };
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
 * Ordenado por created_at DESC. Inclui customer_name se a coluna existir no banco.
 */
export async function getAllOrdersByStore(env: Env, storeId: string): Promise<Order[]> {
  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
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

/**
 * Atualiza o status do pedido (payment_status). Garante isolamento por store_id.
 */
export async function updateOrderStatus(
  env: Env,
  orderId: string,
  storeId: string,
  newStatus: string
): Promise<void> {
  const supabase = getSupabase(env);
  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: newStatus,
      updated_at: new Date().toISOString(),
    })
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
    payment_status: options?.paymentStatus ?? "pending",
    updated_at: new Date().toISOString(),
  };
  if (options?.paymentId != null) {
    payload.payment_id = String(options.paymentId);
  }
  const { error } = await supabase
    .from("orders")
    .update(payload)
    .match({ id: orderId, store_id: storeId });

  if (error) throw new Error(error.message);
}

/**
 * Atualiza o status do pagamento de um pedido (usado pelo webhook do Mercado Pago).
 * Atualiza por id do pedido (external_reference).
 */
export async function updateOrderPaymentStatus(
  env: Env,
  orderId: string,
  status: string,
  _paymentInfo?: { paymentId?: number }
): Promise<void> {
  const supabase = getSupabase(env);
  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

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

/** Registro da view view_audit_report (auditoria com email do usuário). */
export interface AuditReportRow {
  id: string;
  store_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
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
    resource_type: row.resource_type as string,
    resource_id: row.resource_id as string,
    details: row.details as Record<string, unknown> | null,
    created_at: row.created_at as string,
    user_email: (row.user_email as string | null) ?? null,
  }));
}
