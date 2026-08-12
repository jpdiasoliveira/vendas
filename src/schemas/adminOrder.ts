import { z } from "zod";

export const adminOrderStatusPatchSchema = z.object({
  status: z.string().min(1, "Informe o status."),
  cancellationReason: z.string().nullable().optional(),
});

export const adminOrderTrackingPatchSchema = z.object({
  trackingCode: z.string().nullable().optional(),
  shippingMethod: z.string().nullable().optional(),
});

export type AdminOrderStatusPatchInput = z.infer<typeof adminOrderStatusPatchSchema>;
export type AdminOrderTrackingPatchInput = z.infer<typeof adminOrderTrackingPatchSchema>;
