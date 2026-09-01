export const INVITEABLE_MEMBER_ROLES = ["staff", "admin"] as const;
export type InviteableMemberRole = (typeof INVITEABLE_MEMBER_ROLES)[number];

export function isInviteableMemberRole(role: string): role is InviteableMemberRole {
  return role === "staff" || role === "admin";
}

export function canRemoveMember(memberRole: string): boolean {
  return memberRole.trim().toLowerCase() !== "owner";
}

export function canUpdateMemberRole(memberRole: string): boolean {
  const r = memberRole.trim().toLowerCase();
  return r === "staff" || r === "admin";
}

export function wouldExceedStaffLimit(currentStaffAdminCount: number, limit: number | null): boolean {
  if (limit == null) return false;
  return currentStaffAdminCount >= limit;
}

export function getInviteMemberBlockReason(actorRole: string | null | undefined): string | null {
  if ((actorRole ?? "").trim().toLowerCase() !== "owner") {
    return "Apenas o dono da loja pode convidar membros.";
  }
  return null;
}

export function getListMembersBlockReason(actorRole: string | null | undefined): string | null {
  const role = (actorRole ?? "").trim().toLowerCase();
  if (role !== "admin" && role !== "owner") {
    return "Apenas administradores podem visualizar a equipe.";
  }
  return null;
}

export function getStaffLimitBlockReason(staffAdminCount: number, limit: number | null): string | null {
  if (!wouldExceedStaffLimit(staffAdminCount, limit)) return null;
  return `Limite de membros da equipe do plano atingido (${limit ?? 0}). Faça upgrade para convidar mais pessoas.`;
}

export type DeleteMemberGuardInput = {
  targetRole: string;
  targetUserId: string;
  actorUserId: string;
  ownerCount: number;
};

export function getDeleteMemberBlockReason(input: DeleteMemberGuardInput): string | null {
  const targetRole = input.targetRole.trim().toLowerCase();
  if (targetRole === "owner" && input.targetUserId === input.actorUserId && input.ownerCount <= 1) {
    return "Não é possível remover o único dono da loja.";
  }
  if (!canRemoveMember(input.targetRole)) {
    return "Não é possível remover o dono da loja.";
  }
  return null;
}
