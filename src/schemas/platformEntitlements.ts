import { z } from "zod";

const entitlementRowSchema = z.object({
  featureId: z.string().min(1, "featureId é obrigatório."),
  intValue: z.number().int().min(0).nullable().optional(),
  boolValue: z.boolean().nullable().optional(),
});

export const platformEntitlementsPutBodySchema = z.object({
  entitlements: z.array(entitlementRowSchema),
});

export type PlatformEntitlementsPutBody = z.infer<typeof platformEntitlementsPutBodySchema>;
export type PlatformEntitlementWriteRowInput = z.infer<typeof entitlementRowSchema>;
