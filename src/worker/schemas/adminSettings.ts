import { z } from "zod";

const nullableUrl = z.union([z.string().max(2048), z.null()]).optional();

export const adminSettingsPatchSchema = z.object({
  displayName: z.string().max(200).nullable().optional(),
  logoUrl: nullableUrl,
  bannerUrl: nullableUrl,
  primaryColor: z.string().max(32).nullable().optional(),
  minimumOrderValue: z.number().min(0).nullable().optional(),
  publicProfile: z.unknown().optional(),
  theme: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type AdminSettingsPatchInput = z.infer<typeof adminSettingsPatchSchema>;
