import { z } from "zod";

export const newsletterSubscribeBodySchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "E-mail inválido")
    .max(320, "E-mail muito longo")
    .email("E-mail inválido")
    .transform((s) => s.toLowerCase()),
});

export type NewsletterSubscribeBody = z.infer<typeof newsletterSubscribeBodySchema>;
