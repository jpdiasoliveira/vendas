import { z } from "zod";

export const platformRuntimeSettingsPatchSchema = z
  .object({
    subscriptionGraceDays: z.coerce.number().int().min(0).max(90).optional(),
    subscription_grace_days: z.coerce.number().int().min(0).max(90).optional(),
  })
  .refine((body) => body.subscriptionGraceDays !== undefined || body.subscription_grace_days !== undefined, {
    message: "Informe subscriptionGraceDays (0 a 90).",
  })
  .transform((body) => ({
    subscriptionGraceDays: body.subscriptionGraceDays ?? body.subscription_grace_days!,
  }));

export type PlatformRuntimeSettingsPatchBody = z.infer<typeof platformRuntimeSettingsPatchSchema>;

export const platformGraceSettingsFormSchema = z.object({
  subscriptionGraceDays: z.coerce
    .number()
    .int("Use um número inteiro.")
    .min(0, "Mínimo 0 dias.")
    .max(90, "Máximo 90 dias."),
});

export type PlatformGraceSettingsFormValues = z.infer<typeof platformGraceSettingsFormSchema>;
