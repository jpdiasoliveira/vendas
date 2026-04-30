/**
 * Mapeamento snake_case (Supabase) → camelCase (schema TypeScript).
 * Usado apenas pelos repositórios em ./db/.
 */

import type { Category, Order, OrderItem, Product, Store } from "../../../contracts/schema.js";

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

export function rowToProduct(row: Record<string, unknown>): Product {
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
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
  };
}

/** Rótulo de pagamento desacoplado do status logístico (evita “Pendente” após envio). */
function derivePaymentStatusForOrder(row: Record<string, unknown>): string {
  const raw = String(row.status ?? "pending").trim().toLowerCase();
  const paidAt = row.paid_at as string | null | undefined;
  if (raw === "cancelled" || raw === "canceled") return "cancelled";
  if (paidAt) return "approved";
  if (["paid", "approved", "shipped", "delivered"].includes(raw)) return "approved";
  if (raw === "pending") return "pending";
  return "pending";
}

function orderMetadataRecord(row: Record<string, unknown>): Record<string, unknown> {
  const m = row.metadata;
  if (m != null && typeof m === "object" && !Array.isArray(m)) return m as Record<string, unknown>;
  return {};
}

function derivePaymentProvider(row: Record<string, unknown>): string | undefined {
  const meta = orderMetadataRecord(row);
  const fromMeta = meta.payment_provider;
  if (typeof fromMeta === "string" && fromMeta.trim() !== "") return fromMeta.trim();
  const pid = row.payment_id;
  if (pid != null && String(pid).trim() !== "") return "mercadopago";
  return undefined;
}

function derivePaymentPreferenceId(row: Record<string, unknown>): string | undefined {
  const meta = orderMetadataRecord(row);
  const a = meta.mp_checkout_preference_id;
  const b = meta.mp_preference_id;
  if (typeof a === "string" && a.trim() !== "") return a.trim();
  if (typeof b === "string" && b.trim() !== "") return b.trim();
  return undefined;
}

export function rowToOrder(row: Record<string, unknown>): Order {
  const statusVal = row.status as string | null | undefined;
  const fulfillmentStatus = statusVal ?? "pending";
  return {
    id: row.id != null ? String(row.id) : "",
    storeId: String(row.store_id),
    userId: row.user_id != null ? String(row.user_id) : null,
    guestCheckoutEmail: (row.guest_checkout_email as string | null) ?? undefined,
    customerName: (row.customer_name as string | null) ?? undefined,
    customerPhone: (row.customer_phone as string | null) ?? undefined,
    status: fulfillmentStatus,
    total: Number(row.total),
    currency: (row.currency as string | null) ?? undefined,
    paymentMethod: (row.payment_method as string | null) ?? undefined,
    paymentProvider: derivePaymentProvider(row),
    paymentId: (row.payment_id as string | null) ?? undefined,
    paymentPreferenceId: derivePaymentPreferenceId(row),
    paymentStatus: derivePaymentStatusForOrder(row),
    deliveryAddress: (row.delivery_address as string | null) ?? undefined,
    shippingPostalCode: (row.shipping_postal_code as string | null) ?? undefined,
    shippingFee: row.shipping_fee != null ? Number(row.shipping_fee) : undefined,
    couponCode: (row.coupon_code as string | null) ?? undefined,
    couponDiscount: row.coupon_discount != null ? Number(row.coupon_discount) : undefined,
    shippingCity: (row.shipping_city as string | null) ?? undefined,
    shippingState: (row.shipping_state as string | null) ?? undefined,
    trackingCode: (row.tracking_code as string | null) ?? undefined,
    shippingMethod: (row.shipping_method as string | null) ?? undefined,
    paidAt: (row.paid_at as string | null) ?? undefined,
    deliveredAt: (row.delivered_at as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function rowToOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    id: row.id != null ? String(row.id) : undefined,
    orderId: row.order_id != null ? String(row.order_id) : "",
    storeId: String(row.store_id),
    productId: row.product_id != null ? String(row.product_id) : "",
    productName: row.product_name as string,
    productImage: (row.product_image as string | null) ?? undefined,
    quantity: Number(row.quantity),
    price: Number(row.price),
    createdAt: row.created_at as string | undefined,
  };
}

export function rowToStore(row: Record<string, unknown>): Store {
  return {
    id: String(row.id),
    slug: row.slug as string,
    displayName: row.display_name as string,
    status: row.status as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    storeId: String(row.store_id),
    name: row.name as string,
    slug: (row.slug as string | null) ?? undefined,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}
