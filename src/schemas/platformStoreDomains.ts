import { z } from "zod";

export const platformStoreDomainsBodySchema = z.object({
  domains: z
    .array(z.string().trim().min(1, "Domínio inválido."))
    .min(1, "Informe ao menos um domínio."),
  setPrimaryFirst: z.boolean().optional().default(false),
});

export type PlatformStoreDomainsBody = z.infer<typeof platformStoreDomainsBodySchema>;
