import { zValidator } from "@hono/zod-validator";
import {
  countOwnersByStore,
  countStaffAndAdminMembersByStore,
  deleteStoreMember,
  getMemberByIdAndStore,
  getMemberByUserAndStore,
  getStoreCapabilities,
  insertStoreMember,
  listMembersByStore,
  updateStoreMemberRole,
} from "../../core/database.js";
import { resolveOrInviteAuthUser } from "../../core/auth/resolveOrInviteAuthUser.js";
import { getSupabase } from "../../core/supabase.js";
import { storeMemberInviteSchema, storeMemberUpdateSchema } from "../../schemas/storeMember.js";
import { logAction } from "../../utils/audit.js";
import { genericServerErrorMessage, logServerError } from "../../utils/safeApiError.js";
import { requireStoreContext } from "../../utils/requireStoreContext.js";
import {
  canRemoveMember,
  canUpdateMemberRole,
  wouldExceedStaffLimit,
} from "../../utils/storeMemberRules.js";
import type { StoreMemberListItem } from "../../../contracts/schema.js";
import { requireAdminOrOwner, requireOwner, zodErrorToMessage } from "./helpers.js";
import type { AdminHono } from "./types.js";

async function enrichMembersWithEmails(env: Env, members: Awaited<ReturnType<typeof listMembersByStore>>): Promise<StoreMemberListItem[]> {
  const supabase = getSupabase(env);
  const out: StoreMemberListItem[] = [];

  for (const member of members) {
    let email = "";
    try {
      const { data } = await supabase.auth.admin.getUserById(member.userId);
      email = data.user?.email?.trim() ?? "";
    } catch {
      email = "";
    }
    out.push({
      id: member.id,
      userId: member.userId,
      storeId: member.storeId,
      role: member.role,
      email,
      createdAt: member.createdAt,
    });
  }

  return out;
}

function businessErrorStatus(message: string): 400 | 403 | 404 | 409 {
  const lower = message.toLowerCase();
  if (lower.includes("não encontrado") || lower.includes("nao encontrado")) return 404;
  if (lower.includes("já faz parte") || lower.includes("ja faz parte")) return 409;
  if (lower.includes("limite") || lower.includes("permissão") || lower.includes("permissao")) return 403;
  return 400;
}

export const registerAdminMemberRoutes = (admin: AdminHono): void => {
  admin.get("/members", async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    if (!requireAdminOrOwner(c)) {
      return c.json({ success: false, error: "Apenas administradores podem visualizar a equipe." }, 403);
    }
    try {
      const rows = await listMembersByStore(c.env, store.id);
      const data = await enrichMembersWithEmails(c.env, rows);
      return c.json({ success: true, data }, 200);
    } catch (err: unknown) {
      logServerError("admin.get /members", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });

  admin.post(
    "/members",
    zValidator("json", storeMemberInviteSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
      }
    }),
    async (c) => {
      const store = requireStoreContext(c);
      if (store instanceof Response) return store;
      if (!requireOwner(c)) {
        return c.json({ success: false, error: "Apenas o dono da loja pode convidar membros." }, 403);
      }

      const body = c.req.valid("json");
      const email = body.email.trim().toLowerCase();

      try {
        let caps: Awaited<ReturnType<typeof getStoreCapabilities>>;
        try {
          caps = await getStoreCapabilities(c.env, store.id);
        } catch (e: unknown) {
          logServerError("admin.post /members resolve_store_entitlements", e);
          caps = {
            maxProducts: null,
            staffMembersLimit: null,
            customDomain: false,
            advancedAnalytics: false,
            hasActiveSubscription: false,
          };
        }

        const staffAdminCount = await countStaffAndAdminMembersByStore(c.env, store.id);
        if (wouldExceedStaffLimit(staffAdminCount, caps.staffMembersLimit)) {
          const limit = caps.staffMembersLimit ?? 0;
          return c.json(
            {
              success: false,
              error: `Limite de membros da equipe do plano atingido (${limit}). Faça upgrade para convidar mais pessoas.`,
            },
            403,
          );
        }

        const baseUrl = typeof c.env.STOREFRONT_BASE_URL === "string" ? c.env.STOREFRONT_BASE_URL.trim() : "";
        const redirectTo = baseUrl.length > 0 ? `${baseUrl.replace(/\/$/, "")}/auth/callback` : undefined;
        const supabase = getSupabase(c.env);
        const { userId, invited } = await resolveOrInviteAuthUser(supabase, {
          email,
          fullName: body.full_name?.trim() || email,
          redirectTo,
        });

        const duplicate = await getMemberByUserAndStore(c.env, userId, store.id);
        if (duplicate) {
          return c.json({ success: false, error: "Este usuário já faz parte da equipe." }, 409);
        }

        const member = await insertStoreMember(c.env, store.id, userId, body.role);
        await logAction(c, "INVITE_STORE_MEMBER", "store_member", member.id, {
          email,
          role: body.role,
          invited,
        });

        const [enriched] = await enrichMembersWithEmails(c.env, [member]);
        return c.json({ success: true, data: enriched }, 201);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : genericServerErrorMessage();
        if (err instanceof Error && message !== genericServerErrorMessage()) {
          return c.json({ success: false, error: message }, businessErrorStatus(message));
        }
        logServerError("admin.post /members", err);
        return c.json({ success: false, error: genericServerErrorMessage() }, 500);
      }
    },
  );

  admin.patch(
    "/members/:id",
    zValidator("json", storeMemberUpdateSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, error: zodErrorToMessage(result.error) }, 400);
      }
    }),
    async (c) => {
      const store = requireStoreContext(c);
      if (store instanceof Response) return store;
      if (!requireOwner(c)) {
        return c.json({ success: false, error: "Apenas o dono da loja pode alterar papéis." }, 403);
      }

      const memberId = c.req.param("id");
      const body = c.req.valid("json");

      try {
        const current = await getMemberByIdAndStore(c.env, memberId, store.id);
        if (!current) {
          return c.json({ success: false, error: "Membro não encontrado." }, 404);
        }
        if (!canUpdateMemberRole(current.role)) {
          return c.json({ success: false, error: "Não é possível alterar o papel deste membro." }, 403);
        }

        const member = await updateStoreMemberRole(c.env, memberId, store.id, body.role);
        await logAction(c, "UPDATE_STORE_MEMBER_ROLE", "store_member", memberId, {
          role: body.role,
        });

        const [enriched] = await enrichMembersWithEmails(c.env, [member]);
        return c.json({ success: true, data: enriched }, 200);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : genericServerErrorMessage();
        if (err instanceof Error && message !== genericServerErrorMessage()) {
          return c.json({ success: false, error: message }, businessErrorStatus(message));
        }
        logServerError("admin.patch /members/:id", err);
        return c.json({ success: false, error: genericServerErrorMessage() }, 500);
      }
    },
  );

  admin.delete("/members/:id", async (c) => {
    const store = requireStoreContext(c);
    if (store instanceof Response) return store;
    const owner = requireOwner(c);
    if (!owner) {
      return c.json({ success: false, error: "Apenas o dono da loja pode remover membros." }, 403);
    }

    const memberId = c.req.param("id");

    try {
      const current = await getMemberByIdAndStore(c.env, memberId, store.id);
      if (!current) {
        return c.json({ success: false, error: "Membro não encontrado." }, 404);
      }
      if (!canRemoveMember(current.role)) {
        return c.json({ success: false, error: "Não é possível remover o dono da loja." }, 403);
      }
      if (current.userId === owner.id) {
        const owners = await countOwnersByStore(c.env, store.id);
        if (owners <= 1) {
          return c.json({ success: false, error: "Não é possível remover o único dono da loja." }, 403);
        }
      }

      await deleteStoreMember(c.env, memberId, store.id);
      await logAction(c, "REMOVE_STORE_MEMBER", "store_member", memberId, {
        role: current.role,
      });
      return c.json({ success: true, data: { id: memberId } }, 200);
    } catch (err: unknown) {
      logServerError("admin.delete /members/:id", err);
      return c.json({ success: false, error: genericServerErrorMessage() }, 500);
    }
  });
};
