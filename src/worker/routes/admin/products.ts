import { zValidator } from "@hono/zod-validator";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProductsByStore,
  updateProduct,
} from "../../core/database.js";
import { productCreateSchema, productUpdateSchema } from "../../schemas/product.js";
import { logAction } from "../../utils/audit.js";
import { genericServerErrorMessage, logServerError } from "../../utils/safeApiError.js";
import { requireStoreContext } from "../../utils/requireStoreContext.js";
import { zodErrorToMessage } from "./helpers.js";
import type { AdminHono } from "./types.js";

export const registerAdminProductRoutes = (admin: AdminHono): void => {
  admin.get("/products", async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    try {
      const data = await getProductsByStore(c.env, store.id);
      return c.json({ success: true, data }, 200);
    } catch (err: unknown) {
      logServerError("admin.get /products", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
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
      const store = requireStoreContext(c);
      if (store instanceof Response) return store;
      const body = c.req.valid("json");
      try {
        const product = await createProduct(c.env, store.id, {
          name: body.title,
          price: body.price,
          description: body.description ?? null,
          imageUrl: body.image_url || null,
          categoryId: body.category_id ?? null,
          stock: body.stock ?? 0,
          status: body.status ?? "active",
          priceWholesale: body.priceWholesale ?? null,
          minQuantityWholesale: body.minQuantityWholesale ?? null,
        });
        await logAction(c, "CREATE_PRODUCT", "product", product.id);
        return c.json({ success: true, data: product }, 201);
      } catch (err: unknown) {
        logServerError("admin.post /products", err);
        return c.json({ success: false, error: genericServerErrorMessage() }, 500);
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
      const store = requireStoreContext(c);
      if (store instanceof Response) return store;
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
          ...(body.featured_on_home !== undefined && { featuredOnHome: body.featured_on_home }),
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
        if (body.featured_on_home !== undefined && oldProduct != null) {
          const oldMeta = oldProduct.metadata?.featured_on_home === true;
          const newVal = body.featured_on_home === true;
          if (oldMeta !== newVal) changes.featured_on_home = { from: oldMeta, to: newVal };
        }

        const details: Record<string, unknown> = {};
        if (oldProduct?.name) details.product_name = oldProduct.name;
        if (Object.keys(changes).length > 0) details.changes = changes;
        await logAction(c, "UPDATE_PRODUCT", "product", productId, details);
        return c.json({ success: true, data: { id: productId } }, 200);
      } catch (err: unknown) {
        logServerError("admin.put /products/:id", err);
        return c.json({ success: false, error: genericServerErrorMessage() }, 500);
      }
    }
  );

  admin.delete("/products/:id", async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    const productId = c.req.param("id");
    try {
      await deleteProduct(c.env, productId, store.id);
      await logAction(c, "DELETE_PRODUCT", "product", productId);
      return c.json({ success: true, data: { id: productId } }, 200);
    } catch (err: unknown) {
      logServerError("admin.delete /products/:id", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });
};
