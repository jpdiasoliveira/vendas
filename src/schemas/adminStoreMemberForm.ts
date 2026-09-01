import { z } from "zod";

export const adminStoreMemberInviteFormSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  fullName: z.string().trim().min(1, "Informe o nome.").max(120),
  role: z.enum(["staff", "admin"], {
    required_error: "Selecione o papel.",
  }),
});

export type AdminStoreMemberInviteFormValues = z.infer<typeof adminStoreMemberInviteFormSchema>;

export function inviteFormToApiPayload(values: AdminStoreMemberInviteFormValues) {
  return {
    email: values.email.trim(),
    full_name: values.fullName.trim(),
    role: values.role,
  };
}
