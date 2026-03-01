import { Hono } from "hono";
import {
  getAllOrdersByStore,
  getOrderWithItems,
  updateOrderStatus,
  getProductsByStore,
  updateProduct,
} from "../core/database.js";
import { Variables } from "../types.js";

const admin = new Hono<{ Bindings: Env; Variables: Variables }>();

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

admin.put("/products/:id", async (c) => {
  const store = c.get("store");
  const productId = c.req.param("id");
  const body = (await c.req.json()) as {
    price?: number;
    priceWholesale?: number | null;
    minQuantityWholesale?: number | null;
    stock?: number | null;
  };
  try {
    await updateProduct(c.env, productId, store.id, body);
    return c.json({ success: true, data: { id: productId } }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar produto";
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
    return c.json({ success: true, data: { status: newStatus } }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar status";
    return c.json({ success: false, error: message }, 500);
  }
});

export default admin;
