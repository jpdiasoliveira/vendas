import type { SupabaseClient } from "@supabase/supabase-js";
import { findAuthUserIdByEmail } from "./findAuthUserIdByEmail.js";
import { provisionStoreOwnerUser } from "./provisionStoreOwnerUser.js";

type ResolveArgs = {
  email: string;
  fullName: string;
  redirectTo?: string | null;
};

/**
 * Convida novo utilizador ou reutiliza conta Auth existente.
 * Retorna se um convite por e-mail foi enviado.
 */
export async function resolveOrInviteAuthUser(
  supabase: SupabaseClient,
  args: ResolveArgs,
): Promise<{ userId: string; invited: boolean }> {
  const email = args.email.trim().toLowerCase();
  const fullName = args.fullName.trim() || email;

  try {
    const { userId } = await provisionStoreOwnerUser(supabase, {
      email,
      fullName,
      sendPasswordSetupLink: true,
      redirectTo: args.redirectTo,
    });
    return { userId, invited: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "EMAIL_ALREADY_REGISTERED") {
      const userId = await findAuthUserIdByEmail(supabase, email);
      if (!userId) {
        throw new Error("Usuário já cadastrado, mas não foi possível localizar a conta.");
      }
      return { userId, invited: false };
    }
    throw err;
  }
}
