import { z } from "zod";

export const storePaymentsPatchSchema = z.object({
  mpAccessToken: z.union([z.string(), z.null()]).optional(),
  mpPublicKey: z.union([z.string(), z.null()]).optional(),
});

export const storePaymentsTestSchema = z.object({
  mpAccessToken: z.string().optional(),
  mpPublicKey: z.string().optional(),
});
