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
  category?: string | null;
  stock?: number | null;
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
  id: number;
  storeId: string;
  userId: string;
  /** Nome do cliente (opcional; pode vir do perfil do usuário ou ser preenchido no pedido) */
  customerName?: string | null;
  status: string;
  total: number;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  id?: number;
  orderId: number;
  storeId: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  quantity: number;
  price: number;
}

/** Pedido com itens (detalhamento completo para admin). */
export interface OrderDetail {
  id: number;
  storeId: string;
  userId: string;
  customerName?: string | null;
  status: string;
  total: number;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
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
