import { z } from "zod";

function intQuery(defaultVal: number, min: number, max: number) {
  return z
    .union([z.string(), z.undefined()])
    .transform((s) => {
      if (s === undefined || s === "") return defaultVal;
      const n = Number.parseInt(String(s), 10);
      return Number.isFinite(n) ? n : defaultVal;
    })
    .pipe(z.number().int().min(min).max(max));
}

/** Querystring de GET /api/admin/newsletter-subscribers */
export const newsletterAdminListQuerySchema = z.object({
  limit: intQuery(50, 1, 100),
  offset: intQuery(0, 0, 500000),
});

export type NewsletterAdminListQuery = z.infer<typeof newsletterAdminListQuerySchema>;
