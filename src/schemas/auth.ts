import { z } from "zod";

export const authLoginBodySchema = z.object({
  email: z.string().trim().min(1, "E-mail é obrigatório.").email("E-mail inválido."),
  password: z.string().min(1, "Senha é obrigatória."),
});

export type AuthLoginBody = z.infer<typeof authLoginBodySchema>;
