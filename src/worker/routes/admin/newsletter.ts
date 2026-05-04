import type { NewsletterSubscribersPage } from "../../../contracts/schema.js";
import {
  buildNewsletterSubscribersCsv,
  listAllNewsletterSubscribersForExport,
  listNewsletterSubscribersPage,
} from "../../core/db/newsletterSubscribersRepo.js";
import { newsletterAdminListQuerySchema } from "../../schemas/newsletterAdmin.js";
import { genericServerErrorMessage, logServerError } from "../../utils/safeApiError.js";
import { requireStoreContext } from "../../utils/requireStoreContext.js";
import { requireAdminOrOwner } from "./helpers.js";
import type { AdminHono } from "./types.js";

function sanitizeFilenameSlug(slug: string): string {
  const t = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return t || "loja";
}

export const registerAdminNewsletterRoutes = (admin: AdminHono): void => {
  admin.get("/newsletter-subscribers", async (c) => {
    if (!requireAdminOrOwner(c)) {
      return c.json({ success: false, error: "Acesso restrito a administradores ou proprietários" }, 403);
    }
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;

    const rawLimit = c.req.query("limit");
    const rawOffset = c.req.query("offset");
    const parsed = newsletterAdminListQuerySchema.safeParse({
      limit: rawLimit === undefined || rawLimit === "" ? undefined : rawLimit,
      offset: rawOffset === undefined || rawOffset === "" ? undefined : rawOffset,
    });
    if (!parsed.success) {
      return c.json({ success: false, error: "Parâmetros de paginação inválidos" }, 400);
    }
    const { limit, offset } = parsed.data;

    try {
      const { items, total } = await listNewsletterSubscribersPage(c.env, store.id, { limit, offset });
      const data: NewsletterSubscribersPage = { items, total, limit, offset };
      return c.json({ success: true, data }, 200);
    } catch (err: unknown) {
      logServerError("admin.get /newsletter-subscribers", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });

  admin.get("/newsletter-subscribers/export.csv", async (c) => {
    if (!requireAdminOrOwner(c)) {
      return c.json({ success: false, error: "Acesso restrito a administradores ou proprietários" }, 403);
    }
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;

    try {
      const rows = await listAllNewsletterSubscribersForExport(c.env, store.id);
      const csv = buildNewsletterSubscribersCsv(rows);
      const safeSlug = sanitizeFilenameSlug(store.slug);
      const filename = `newsletter-inscritos-${safeSlug}.csv`;
      return c.text(csv, 200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      });
    } catch (err: unknown) {
      logServerError("admin.get /newsletter-subscribers/export.csv", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });
};
