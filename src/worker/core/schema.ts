/**
 * Source of Truth: interfaces globais baseadas no banco.
 * DB: snake_case (PostgreSQL/Supabase). Código: camelCase (TypeScript).
 * O mapeamento snake_case <-> camelCase fica na camada database.ts.
 */

export interface Store {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** Dados de configuração da loja (store_settings + display_name de stores). */
export interface StoreSettings {
  displayName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  minimumOrderValue?: number | null;
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
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  /** ID do pedido (UUID no Supabase). */
  id: string;
  storeId: string;
  userId: string;
  /** Nome do cliente (opcional; pode vir do perfil do usuário ou ser preenchido no pedido) */
  customerName?: string | null;
  /** Telefone do cliente (customer_phone no banco) */
  customerPhone?: string | null;
  status: string;
  total: number;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  /** Endereço completo de entrega (coluna delivery_address no banco) */
  deliveryAddress?: string | null;
  /** Cidade do endereço de entrega (orders ou delivery_addresses) */
  shippingCity?: string | null;
  /** UF do endereço de entrega */
  shippingState?: string | null;
  /** Código de rastreio da transportadora */
  trackingCode?: string | null;
  /** Nome/método da transportadora */
  shippingMethod?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  id?: number;
  orderId: string;
  storeId: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  quantity: number;
  price: number;
}

/** Pedido com itens (detalhamento completo para admin). */
export interface OrderDetail {
  id: string;
  storeId: string;
  userId: string;
  customerName?: string | null;
  customerPhone?: string | null;
  status: string;
  total: number;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  deliveryAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  trackingCode?: string | null;
  shippingMethod?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
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
