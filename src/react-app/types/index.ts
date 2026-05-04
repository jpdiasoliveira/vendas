/**
 * Tipos do frontend: contrato partilhado em `src/contracts` (Worker + Vite).
 */
export type { StorePublicProfile } from "@/contracts/storePublicProfile";

export type {
  Store,
  StoreCapabilities,
  StoreSettings,
  StoreMember,
  Product,
  Order,
  OrderItem,
  OrderDetail,
  Category,
  NewsletterSubscriberListItem,
  NewsletterSubscribersPage,
  CartItemPayload,
  ApiSuccess,
  ApiError,
  ApiResponse,
} from "@/contracts/schema";

/** Pedido com itens (resposta de GET /api/orders/:id) */
export type OrderWithItems = import("@/contracts/schema").Order & {
  items?: import("@/contracts/schema").OrderItem[];
};
