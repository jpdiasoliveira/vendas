import { zValidator } from "@hono/zod-validator";
import {
  createCategory,
  deleteCategory,
  getCategoriesByStore,
  getCategoryByIdAndStore,
  updateCategory,
} from "../../core/database.js";
import { categoryCreateSchema, categoryUpdateSchema } from "../../schemas/category.js";
import { logAction } from "../../utils/audit.js";
import { genericServerErrorMessage, logServerError } from "../../utils/safeApiError.js";
import { requireStoreContext } from "../../utils/requireStoreContext.js";
import { zodErrorToMessage } from "./helpers.js";
import type { AdminHono } from "./types.js";

export const registerAdminCategoryRoutes = (admin: AdminHono): void => {
  admin.get("/categories", async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    try {
      const data = await getCategoriesByStore(c.env, store.id);
      return c.json({ success: true, data }, 200);
    } catch (err: unknown) {
      logServerError("admin.get /categories", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });

  admin.post(
    "/categories",
    zValidator("json", categoryCreateSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
      }
    }),
    async (c) => {
      const store = requireStoreContext(c);
      if (store instanceof Response) return store;
      const body = c.req.valid("json");
      try {
        const cat = await createCategory(c.env, store.id, {
          name: body.name,
          slug: body.slug ?? null,
          sortOrder: body.sort_order ?? null,
        });
        await logAction(c, "CREATE_CATEGORY", "category", cat.id, { name: cat.name, slug: cat.slug ?? null });
        return c.json({ success: true, data: cat }, 201);
      } catch (err: unknown) {
        logServerError("admin.post /categories", err);
        return c.json({ success: false, error: genericServerErrorMessage() }, 500);
      }
    }
  );

  admin.patch(
    "/categories/:id",
    zValidator("json", categoryUpdateSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
      }
    }),
    async (c) => {
      const store = requireStoreContext(c);
      if (store instanceof Response) return store;
      const categoryId = c.req.param("id");
      const body = c.req.valid("json");
      try {
        const prev = await getCategoryByIdAndStore(c.env, categoryId, store.id);
        if (!prev) {
          return c.json({ success: false, error: "Categoria não encontrada." }, 404);
        }
        const cat = await updateCategory(c.env, categoryId, store.id, {
          name: body.name,
          slug: body.slug,
          sortOrder: body.sort_order ?? undefined,
        });
        await logAction(c, "UPDATE_CATEGORY", "category", categoryId, {
          name: cat.name,
          slug: cat.slug ?? null,
          sort_order: cat.sortOrder ?? null,
        });
        return c.json({ success: true, data: cat }, 200);
      } catch (err: unknown) {
        logServerError("admin.patch /categories/:id", err);
        return c.json({ success: false, error: genericServerErrorMessage() }, 500);
      }
    }
  );

  admin.delete("/categories/:id", async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    const categoryId = c.req.param("id");
    try {
      const prev = await getCategoryByIdAndStore(c.env, categoryId, store.id);
      if (!prev) {
        return c.json({ success: false, error: "Categoria não encontrada." }, 404);
      }
      await deleteCategory(c.env, categoryId, store.id);
      await logAction(c, "DELETE_CATEGORY", "category", categoryId, { name: prev.name });
      return c.json({ success: true, data: { id: categoryId } }, 200);
    } catch (err: unknown) {
      logServerError("admin.delete /categories/:id", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });
};
