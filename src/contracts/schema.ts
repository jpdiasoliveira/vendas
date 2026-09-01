/**
 * Source of Truth: interfaces globais baseadas no banco.
 * DB: snake_case (PostgreSQL/Supabase). Código: camelCase (TypeScript).
 * Partilhado entre Worker e app Vite (LSP só carrega `src/contracts` no projeto da UI).
 */

import type { StorePublicProfile } from "./storePublicProfile.js";

export type { StorePublicProfile } from "./storePublicProfile.js";

export interface Store {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Direitos efetivos da loja (RPC `resolve_store_entitlements`).
 * `null` em limites numéricos = sem teto (ilimitado).
 */
export interface StoreCapabilities {
  maxProducts: number | null;
  staffMembersLimit: number | null;
  customDomain: boolean;
  advancedAnalytics: boolean;
  /** true quando a RPC retornou ao menos uma linha (assinatura ativa mapeada). */
  hasActiveSubscription: boolean;
}

/** Dados de configuração da loja (store_settings + display_name de stores). */
export interface StoreSettings {
  displayName: string;
  logoUrl?: string | null;
  /** Imagem larga do hero na vitrine (URL pública). */
  bannerUrl?: string | null;
  primaryColor?: string | null;
  minimumOrderValue?: number | null;
  /** Conteúdo de store_settings.public_profile (JSONB). */
  publicProfile?: StorePublicProfile;
  /** Aparência extra (theme JSONB). */
  theme?: Record<string, unknown> | null;
  /** Regras de negócio (JSONB). */
  businessRules?: Record<string, unknown> | null;
  /** Horários / SLA (JSONB). */
  operatingHours?: Record<string, unknown> | null;
  /** Limites de pedido (JSONB). */
  orderLimits?: Record<string, unknown> | null;
  /** Mapa de direitos da assinatura atual (Bloco 2). */
  capabilities?: StoreCapabilities;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description?: string | null;
  price: number;
  /** Preço por unidade quando atinge quantidade mínima de atacado */
  priceWholesale?: number | null;
  /** Quantidade mínima para ativar o preço de atacado */
  minQuantityWholesale?: number | null;
  imageUrl?: string | null;
  /** UUID da linha em `categories` */
  categoryId?: string | null;
  /** Nome da categoria (quando a listagem faz join com `categories`) */
  category?: string | null;
  stock?: number | null;
  /** Visibilidade no catálogo: 'active' | 'inactive' (coluna status no banco) */
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
  /**
   * Metadados do SKU (JSONB). Chaves conhecidas:
   * - `featured_on_home` (boolean): destaque visual na vitrine (admin).
   */
  metadata?: Record<string, unknown> | null;
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  slug?: string;
  sortOrder?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Faixa de frete por CEP (`store_shipping_fare_bands`). */
export interface ShippingFareBand {
  id: string;
  storeId: string;
  cepFrom: number;
  cepTo: number;
  amountBrl: number;
  label?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Cupom de desconto da loja (`store_coupons`). */
export interface StoreCoupon {
  id: string;
  storeId: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Linha de inscrito na newsletter (admin). */
export interface NewsletterSubscriberListItem {
  email: string;
  status: string;
  /** ISO 8601 (`created_at`). */
  subscribedAt: string;
}

/** Resposta paginada de GET /api/admin/newsletter-subscribers. */
export interface NewsletterSubscribersPage {
  items: NewsletterSubscriberListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface Order {
  /** ID do pedido (UUID no Supabase). */
  id: string;
  storeId: string;
  /** Usuário Supabase; null em pedido checkout visitante. */
  userId: string | null;
  /** E-mail usado para validar pagamento/consulta quando userId é null. */
  guestCheckoutEmail?: string | null;
  /** Nome do cliente (opcional; pode vir do perfil do usuário ou ser preenchido no pedido) */
  customerName?: string | null;
  /** Telefone do cliente (customer_phone no banco) */
  customerPhone?: string | null;
  status: string;
  total: number;
  currency?: string | null;
  paymentMethod?: string | null;
  /** Gateway (ex.: mercadopago); alinhado a payment_id no índice único parcial. */
  paymentProvider?: string | null;
  paymentId?: string | null;
  /** ID da preferência Checkout Pro (Mercado Pago). */
  paymentPreferenceId?: string | null;
  paymentStatus?: string | null;
  /** Endereço completo de entrega (coluna delivery_address no banco) */
  deliveryAddress?: string | null;
  /** CEP (8 dígitos) usado no cálculo de frete */
  shippingPostalCode?: string | null;
  /** Valor do frete em R$ (servidor) */
  shippingFee?: number | null;
  /** Cupom aplicado (normalizado em minúsculas) */
  couponCode?: string | null;
  /** Desconto do cupom em R$ (servidor) */
  couponDiscount?: number | null;
  /** Cidade do endereço de entrega (coluna orders.shipping_city) */
  shippingCity?: string | null;
  /** UF do endereço de entrega */
  shippingState?: string | null;
  /** Código de rastreio da transportadora */
  trackingCode?: string | null;
  /** Nome/método da transportadora */
  shippingMethod?: string | null;
  paidAt?: string | null;
  deliveredAt?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  id?: string;
  orderId: string;
  storeId: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  quantity: number;
  price: number;
  createdAt?: string;
}

/** Pedido com itens (detalhamento completo para admin). */
export interface OrderDetail {
  id: string;
  storeId: string;
  userId: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  status: string;
  total: number;
  paymentMethod?: string | null;
  paymentProvider?: string | null;
  paymentStatus?: string | null;
  deliveryAddress?: string | null;
  shippingPostalCode?: string | null;
  shippingFee?: number | null;
  couponCode?: string | null;
  couponDiscount?: number | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  trackingCode?: string | null;
  shippingMethod?: string | null;
  guestCheckoutEmail?: string | null;
  currency?: string | null;
  paymentPreferenceId?: string | null;
  paymentId?: string | null;
  paidAt?: string | null;
  deliveredAt?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
}

/** Membro da loja (Supabase Auth + store_members). */
export interface StoreMember {
  id: string;
  userId: string;
  storeId: string;
  role: string;
}

/** Membro listado no painel admin (inclui e-mail resolvido via Auth Admin). */
export interface StoreMemberListItem extends StoreMember {
  email: string;
  createdAt: string;
}

/** Payload do carrinho enviado pelo frontend (camelCase) */
export interface CartItemPayload {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  imageUrl?: string;
}

/** Resposta padrão da API */
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
