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
