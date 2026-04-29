import type { SupabaseClient } from "@supabase/supabase-js";

type ProvisionArgs = {
  email: string;
  fullName: string;
  sendPasswordSetupLink: boolean;
  initialPassword?: string;
  /** URL absoluta para o convite (ex.: origem + /auth/callback). */
  redirectTo?: string | null;
};

/**
 * Cria o utilizador Auth do dono da loja (senha imediata ou convite por e-mail).
 * Usa a service role; falhas comuns mapeadas para mensagens curtas.
 */
export const provisionStoreOwnerUser = async (
  supabase: SupabaseClient,
  args: ProvisionArgs
): Promise<{ userId: string }> => {
  const email = args.email.trim().toLowerCase();
  const meta = { full_name: args.fullName, display_name: args.fullName };

  if (args.sendPasswordSetupLink) {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: meta,
      redirectTo: args.redirectTo ?? undefined,
    });
    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes("already") || m.includes("registered")) {
        throw new Error("EMAIL_ALREADY_REGISTERED");
      }
      throw new Error(error.message);
    }
    if (!data.user) throw new Error("INVITE_FAILED");
    return { userId: data.user.id };
  }

  const pwd = args.initialPassword?.trim() ?? "";
  if (pwd.length < 8) throw new Error("PASSWORD_TOO_SHORT");

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: pwd,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("already") || m.includes("registered") || m.includes("duplicate")) {
      throw new Error("EMAIL_ALREADY_REGISTERED");
    }
    throw new Error(error.message);
  }
  if (!data.user) throw new Error("CREATE_USER_FAILED");
  return { userId: data.user.id };
};
