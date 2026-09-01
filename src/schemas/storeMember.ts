import { z } from "zod";

export const storeMemberInviteSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  role: z.enum(["staff", "admin"], {
    required_error: "Selecione o papel do membro.",
    invalid_type_error: "Papel inválido.",
  }),
  full_name: z.string().trim().min(1, "Informe o nome.").max(120).optional(),
});

export const storeMemberUpdateSchema = z.object({
  role: z.enum(["staff", "admin"], {
    required_error: "Selecione o papel do membro.",
    invalid_type_error: "Papel inválido.",
  }),
});

export type StoreMemberInviteInput = z.infer<typeof storeMemberInviteSchema>;
export type StoreMemberUpdateInput = z.infer<typeof storeMemberUpdateSchema>;
