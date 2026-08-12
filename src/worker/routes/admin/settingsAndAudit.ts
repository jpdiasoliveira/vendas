import { zValidator } from "@hono/zod-validator";
import {
  getAuditLogs,
  getStoreSettingsWithDisplayName,
  updateStoreSettingsAndDisplayName,
} from "../../core/database.js";
import { getSupabase } from "../../core/supabase.js";
import { parsePublicProfile } from "../../../contracts/storePublicProfile.js";
import { adminSettingsPatchSchema } from "../../schemas/adminSettings.js";
import type { AuthUser } from "../../middlewares/verifyAuth.js";
import { genericServerErrorMessage, logServerError } from "../../utils/safeApiError.js";
import { requireStoreContext } from "../../utils/requireStoreContext.js";
import {
  BUCKET_PRODUCT_IMAGES,
  requireAdminOrOwner,
  uniqueFileName,
  zodErrorToMessage,
} from "./helpers.js";
import type { AdminHono } from "./types.js";

export const registerAdminSettingsAndAuditRoutes = (admin: AdminHono): void => {
  admin.get("/me", async (c) => {
    const user = c.get("user") as AuthUser | undefined;
    if (!user) return c.json({ success: false, error: "Não autorizado" }, 401);
    return c.json({ success: true, data: { id: user.id, role: user.role } }, 200);
  });

  admin.get("/settings", async (c) => {
    if (!requireAdminOrOwner(c)) {
      return c.json({ success: false, error: "Acesso restrito a administradores ou proprietários" }, 403);
    }
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    try {
      const data = await getStoreSettingsWithDisplayName(c.env, store.id);
      return c.json({ success: true, data }, 200);
    } catch (err: unknown) {
      logServerError("admin.get /settings", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });

  admin.patch(
    "/settings",
    zValidator("json", adminSettingsPatchSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
      }
    }),
    async (c) => {
      if (!requireAdminOrOwner(c)) {
        return c.json({ success: false, error: "Acesso restrito a administradores ou proprietários" }, 403);
      }
      const store = requireStoreContext(c);
      if (store instanceof Response) return store;
      try {
        const body = c.req.valid("json");
        await updateStoreSettingsAndDisplayName(c.env, store.id, {
          displayName: body.displayName,
          logoUrl: body.logoUrl,
          bannerUrl: body.bannerUrl,
          primaryColor: body.primaryColor,
          minimumOrderValue: body.minimumOrderValue,
          ...(body.theme !== undefined ? { theme: body.theme } : {}),
          publicProfile:
            body.publicProfile !== undefined ? parsePublicProfile(body.publicProfile) : undefined,
        });
        const data = await getStoreSettingsWithDisplayName(c.env, store.id);
        return c.json({ success: true, data }, 200);
      } catch (err: unknown) {
        logServerError("admin.patch /settings", err);
        return c.json({ success: false, error: genericServerErrorMessage() }, 500);
      }
    }
  );

  admin.get("/audit-logs", async (c) => {
    const user = c.get("user") as AuthUser | undefined;
    const role = (user?.role ?? "").toLowerCase();
    if (role !== "admin" && role !== "owner") {
      return c.json({ success: false, error: "Acesso restrito a administradores ou proprietários" }, 403);
    }
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    try {
      const search = c.req.query("search");
      const action = c.req.query("action");
      const actionsRaw = c.req.query("actions");
      const actions =
        actionsRaw != null && actionsRaw.trim() !== ""
          ? actionsRaw
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;
      const data = await getAuditLogs(c.env, store.id, {
        ...(search != null && search !== "" ? { search } : {}),
        ...(actions != null && actions.length > 0
          ? { actions }
          : action != null && action !== ""
            ? { action }
            : {}),
      });
      return c.json({ success: true, data }, 200);
    } catch (err: unknown) {
      logServerError("admin.get /audit-logs", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });

  /**
   * Upload de imagem para Supabase Storage (bucket product-images).
   * Apenas administradores logados (verifyAuth). Retorna publicUrl.
   */
  admin.post("/upload", async (c) => {
    if (!requireAdminOrOwner(c)) {
      return c.json({ success: false, error: "Acesso restrito a administradores ou proprietários" }, 403);
    }
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
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
        logServerError("admin.upload storage", uploadError);
        return c.json({ success: false, error: genericServerErrorMessage() }, 500);
      }
      const { data: urlData } = supabase.storage.from(BUCKET_PRODUCT_IMAGES).getPublicUrl(path);
      return c.json({ success: true, data: { publicUrl: urlData.publicUrl } }, 201);
    } catch (err: unknown) {
      logServerError("admin.post /upload", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });
};
