/**
 * Tipos do frontend: espelho do schema do Worker (Source of Truth).
 * Re-exporta de src/worker/core/schema para garantir consistência.
 */
export type {
  Store,
  Product,
  Order,
  OrderItem,
  OrderDetail,
  Category,
  CartItemPayload,
  ApiSuccess,
  ApiError,
  ApiResponse,
} from "@/worker/core/schema";

/** Pedido com itens (resposta de GET /api/orders/:id) */
export type OrderWithItems = import("@/worker/core/schema").Order & {
  items?: import("@/worker/core/schema").OrderItem[];
};
