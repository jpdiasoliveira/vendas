import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  getAllOrdersByStore,
  getOrderWithItems,
  updateOrderStatus,
  updateOrderTracking,
  normalizeOrderStatus,
  getProductsByStore,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAuditLogs,
  getStoreSettingsWithDisplayName,
  updateStoreSettingsAndDisplayName,
} from "../core/database.js";
import { getSupabase } from "../core/supabase.js";
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

/** Apenas admin ou owner podem acessar configurações da loja. */
function requireAdminOrOwner(c: { get: (k: string) => unknown }) {
  const user = c.get("user") as AuthUser | undefined;
  if (!user) return null;
  const role = (user.role ?? "").toLowerCase();
  if (role === "admin" || role === "owner") return user;
  return null;
}

admin.get("/me", async (c) => {
  const user = c.get("user") as AuthUser | undefined;
  if (!user) return c.json({ success: false, error: "Não autorizado" }, 401);
  return c.json({ success: true, data: { id: user.id, role: user.role } }, 200);
});

admin.get("/settings", async (c) => {
  if (!requireAdminOrOwner(c)) {
    return c.json({ success: false, error: "Acesso restrito a administradores ou proprietários" }, 403);
  }
  const store = c.get("store");
  try {
    const data = await getStoreSettingsWithDisplayName(c.env, store.id);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao carregar configurações";
    return c.json({ success: false, error: message }, 500);
  }
});

admin.patch("/settings", async (c) => {
  if (!requireAdminOrOwner(c)) {
    return c.json({ success: false, error: "Acesso restrito a administradores ou proprietários" }, 403);
  }
  const store = c.get("store");
  const body = (await c.req.json()) as {
    displayName?: string | null;
    logoUrl?: string | null;
    primaryColor?: string | null;
    minimumOrderValue?: number | null;
  };
  try {
    await updateStoreSettingsAndDisplayName(c.env, store.id, {
      displayName: body.displayName,
      logoUrl: body.logoUrl,
      primaryColor: body.primaryColor,
      minimumOrderValue:
        body.minimumOrderValue != null ? Number(body.minimumOrderValue) : body.minimumOrderValue,
    });
    const data = await getStoreSettingsWithDisplayName(c.env, store.id);
    return c.json({ success: true, data }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao salvar configurações";
    return c.json({ success: false, error: message }, 500);
  }
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

const BUCKET_PRODUCT_IMAGES = "product-images";

/** Gera nome único para arquivo: timestamp-nome-sanitizado.ext */
function uniqueFileName(originalName: string): string {
  const sanitized = originalName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80) || "image";
  const ext = originalName.includes(".")
    ? originalName.split(".").pop()?.toLowerCase() || "jpg"
    : "jpg";
  const base = sanitized.includes(".") ? sanitized : `${sanitized}.${ext}`;
  return `${Date.now()}-${base}`;
}

/**
 * Upload de imagem para Supabase Storage (bucket product-images).
 * Apenas administradores logados (verifyAuth). Retorna publicUrl.
 */
admin.post("/upload", async (c) => {
  const store = c.get("store");
  try {
    const contentType = c.req.header("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return c.json({ success: false, error: "Content-Type deve ser multipart/form-data" }, 400);
    }
    const formData = await c.req.formData();
    const file = formData.get("file") ?? formData.get("image") ?? formData.get("file[]");
    if (!file || !(file instanceof File)) {
      return c.json({ success: false, error: "Nenhum arquivo enviado (use o campo 'file' ou 'image')" }, 400);
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ success: false, error: "Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF." }, 400);
    }
    const path = `${store.id}/${uniqueFileName(file.name)}`;
    const supabase = getSupabase(c.env);
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_PRODUCT_IMAGES)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      console.error("Upload product image error:", uploadError);
      return c.json({ success: false, error: uploadError.message }, 500);
    }
    const { data: urlData } = supabase.storage.from(BUCKET_PRODUCT_IMAGES).getPublicUrl(path);
    return c.json({ success: true, publicUrl: urlData.publicUrl }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro no upload";
    console.error("Admin upload error:", err);
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
        priceWholesale: body.priceWholesale ?? null,
        minQuantityWholesale: body.minQuantityWholesale ?? null,
        unit: body.unit_type ?? null,
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
      const oldProduct = await getProductById(c.env, productId, store.id);
      const updatePayload = {
        ...(body.price !== undefined && { price: body.price }),
        ...(body.priceWholesale !== undefined && { priceWholesale: body.priceWholesale }),
        ...(body.minQuantityWholesale !== undefined && { minQuantityWholesale: body.minQuantityWholesale }),
        ...(body.stock !== undefined && { stock: body.stock }),
        ...(body.title !== undefined && { name: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.image_url !== undefined && { imageUrl: body.image_url || null }),
        ...(body.status !== undefined && { status: body.status }),
      };
      await updateProduct(c.env, productId, store.id, updatePayload);

      const changes: Record<string, { from: unknown; to: unknown }> = {};
      if (body.price !== undefined && oldProduct != null && Number(oldProduct.price) !== Number(body.price)) {
        changes.price = { from: oldProduct.price, to: body.price };
      }
      if (body.priceWholesale !== undefined && oldProduct != null) {
        const oldVal = oldProduct.priceWholesale ?? null;
        const newVal = body.priceWholesale ?? null;
        if (Number(oldVal) !== Number(newVal)) changes.price_wholesale = { from: oldVal, to: newVal };
      }
      if (body.stock !== undefined && oldProduct != null) {
        const oldVal = oldProduct.stock ?? 0;
        const newVal = body.stock;
        if (Number(oldVal) !== Number(newVal)) changes.stock = { from: oldVal, to: newVal };
      }
      if (body.status !== undefined && oldProduct != null) {
        const oldVal = oldProduct.status ?? "active";
        const newVal = body.status ?? "active";
        if (String(oldVal) !== String(newVal)) changes.active = { from: oldVal, to: newVal };
      }

      const details: Record<string, unknown> = {};
      if (oldProduct?.name) details.product_name = oldProduct.name;
      if (Object.keys(changes).length > 0) details.changes = changes;
      await logAction(c, "UPDATE_PRODUCT", "product", productId, details);
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
