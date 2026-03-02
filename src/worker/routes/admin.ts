import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  getAllOrdersByStore,
  getOrderWithItems,
  updateOrderStatus,
  getProductsByStore,
  createProduct,
  updateProduct,
  deleteProduct,
  getAuditLogsByStore,
} from "../core/database.js";
import { productCreateSchema, productUpdateSchema } from "../schemas/product.js";
import { Variables } from "../types.js";
import type { AuthUser } from "../middlewares/verifyAuth.js";
import { logAction } from "../utils/audit.js";

const admin = new Hono<{ Bindings: Env; Variables: Variables }>();

/** Formata erros do Zod em mensagem única para resposta 400. */
function zodErrorToMessage(error: { issues: { message: string; path: (string | number)[] }[] }): string {
  const messages = error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message));
  return messages.length > 0 ? messages.join("; ") : "Dados inválidos.";
}

admin.get("/me", async (c) => {
  const user = c.get("user") as AuthUser | undefined;
  if (!user) return c.json({ success: false, error: "Não autorizado" }, 401);
  return c.json({ success: true, data: { id: user.id, role: user.role } }, 200);
});

admin.get("/audit-logs", async (c) => {
  const user = c.get("user") as AuthUser | undefined;
  if (user?.role !== "admin") {
    return c.json({ success: false, error: "Acesso restrito a administradores" }, 403);
  }
  try {
    const store = c.get("store");
    const data = await getAuditLogsByStore(c.env, store.id);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao carregar logs";
    console.error("Admin audit-logs error:", err);
    return c.json({ success: false, error: message }, 500);
  }
});

admin.get("/products", async (c) => {
  try {
    const store = c.get("store");
    const data = await getProductsByStore(c.env, store.id);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao buscar produtos";
    console.error("Admin products error:", err);
    return c.json({ success: false, error: message }, 500);
  }
});

admin.post(
  "/products",
  zValidator("json", productCreateSchema, (result, c) => {
    if (!result.success) {
      return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
    }
  }),
  async (c) => {
    const store = c.get("store");
    const body = c.req.valid("json");
    try {
      const product = await createProduct(c.env, store.id, {
        name: body.title,
        price: body.price,
        description: body.description ?? null,
        imageUrl: body.image_url || null,
      });
      await logAction(c, "CREATE_PRODUCT", "product", product.id);
      return c.json({ success: true, data: product }, 201);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar produto";
      return c.json({ success: false, error: message }, 500);
    }
  }
);

admin.put(
  "/products/:id",
  zValidator("json", productUpdateSchema, (result, c) => {
    if (!result.success) {
      return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
    }
  }),
  async (c) => {
    const store = c.get("store");
    const productId = c.req.param("id");
    const body = c.req.valid("json");
    try {
      await updateProduct(c.env, productId, store.id, {
        ...(body.price !== undefined && { price: body.price }),
        ...(body.priceWholesale !== undefined && { priceWholesale: body.priceWholesale }),
        ...(body.minQuantityWholesale !== undefined && { minQuantityWholesale: body.minQuantityWholesale }),
        ...(body.stock !== undefined && { stock: body.stock }),
        ...(body.title !== undefined && { name: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.image_url !== undefined && { imageUrl: body.image_url || null }),
      });
      await logAction(c, "UPDATE_PRODUCT", "product", productId);
      return c.json({ success: true, data: { id: productId } }, 200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar produto";
      return c.json({ success: false, error: message }, 500);
    }
  }
);

admin.delete("/products/:id", async (c) => {
  const store = c.get("store");
  const productId = c.req.param("id");
  try {
    await deleteProduct(c.env, productId, store.id);
    await logAction(c, "DELETE_PRODUCT", "product", productId);
    return c.json({ success: true, data: { id: productId } }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao excluir produto";
    return c.json({ success: false, error: message }, 500);
  }
});

admin.get("/orders", async (c) => {
  try {
    const store = c.get("store");
    const data = await getAllOrdersByStore(c.env, store.id);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao buscar pedidos";
    console.error("Admin orders error:", err);
    return c.json({ success: false, error: message }, 500);
  }
});

admin.get("/orders/:id", async (c) => {
  const store = c.get("store");
  const orderId = c.req.param("id");
  try {
    const data = await getOrderWithItems(c.env, orderId, store.id);
    if (!data) return c.json({ success: false, error: "Pedido não encontrado" }, 404);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao buscar pedido";
    return c.json({ success: false, error: message }, 500);
  }
});

admin.patch("/orders/:id/status", async (c) => {
  const store = c.get("store");
  const orderId = c.req.param("id");
  const body = (await c.req.json()) as { status?: string };
  const newStatus = body.status?.trim();
  if (!newStatus) {
    return c.json({ success: false, error: "Campo status é obrigatório" }, 400);
  }
  try {
    await updateOrderStatus(c.env, orderId, store.id, newStatus);
    await logAction(c, "UPDATE_ORDER_STATUS", "order", orderId, { status: newStatus });
    return c.json({ success: true, data: { status: newStatus } }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar status";
    return c.json({ success: false, error: message }, 500);
  }
});

export default admin;
