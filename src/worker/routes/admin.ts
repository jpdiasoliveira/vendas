import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  getAllOrdersByStore,
  getOrderWithItems,
  updateOrderStatus,
  updateOrderTracking,
  normalizeOrderStatus,
  getProductsByStore,
  createProduct,
  updateProduct,
  deleteProduct,
  getAuditLogs,
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
    const search = c.req.query("search");
    const action = c.req.query("action");
    const data = await getAuditLogs(c.env, store.id, {
      ...(search != null && search !== "" && { search }),
      ...(action != null && action !== "" && { action }),
    });
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao carregar logs";
    console.error("Admin audit-logs error:", err);
    return c.json({ success: false, error: message }, 500);
  }
});

/** Lista produtos da loja do admin (filtro por store_id — segurança multi-tenant). */
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
        category: body.category ?? null,
        stock: body.stock ?? 0,
        status: body.status ?? "active",
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
        ...(body.status !== undefined && { status: body.status }),
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
    const payload = { ...data, items: Array.isArray(data.items) ? data.items : [] };
    return c.json({ success: true, data: payload }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao buscar pedido";
    return c.json({ success: false, error: message }, 500);
  }
});

admin.patch("/orders/:id/status", async (c) => {
  const store = c.get("store");
  const orderId = String(c.req.param("id"));
  const body = (await c.req.json()) as { status?: string };
  const newStatus = normalizeOrderStatus(body.status);
  if (!newStatus) {
    return c.json(
      { success: false, error: "Status inválido. Use: pending, paid, shipped ou cancelled." },
      400
    );
  }
  try {
    await updateOrderStatus(c.env, orderId, store.id, newStatus);
    await logAction(c, "UPDATE_ORDER_STATUS", "order", orderId, { status: newStatus });
    return c.json({ success: true, data: { status: newStatus } }, 200);
  } catch (err: unknown) {
    console.error("[PATCH /api/admin/orders/:id/status] Erro ao atualizar status:", {
      orderId,
      newStatus: newStatus,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    const message = err instanceof Error ? err.message : "Erro ao atualizar status";
    return c.json({ success: false, error: message }, 500);
  }
});

admin.patch("/orders/:id/tracking", async (c) => {
  const store = c.get("store");
  const orderId = c.req.param("id");
  const body = (await c.req.json()) as { trackingCode?: string | null; shippingMethod?: string | null };
  try {
    await updateOrderTracking(c.env, orderId, store.id, {
      trackingCode: body.trackingCode,
      shippingMethod: body.shippingMethod,
    });
    await logAction(c, "UPDATE_ORDER_TRACKING", "order", orderId, {
      trackingCode: body.trackingCode ?? null,
      shippingMethod: body.shippingMethod ?? null,
    });
    return c.json({ success: true, data: { ok: true } }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar rastreio";
    return c.json({ success: false, error: message }, 500);
  }
});

export default admin;
