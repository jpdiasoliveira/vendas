export type StoreMemberRole = "staff" | "admin" | "owner";

const ROLE_RANK: Record<StoreMemberRole, number> = {
  staff: 1,
  admin: 2,
  owner: 3,
};

/** Normaliza role vinda de `store_members` / `/api/admin/me`. */
export function normalizeStoreRole(role: string | null | undefined): StoreMemberRole | null {
  const r = (role ?? "").trim().toLowerCase();
  if (r === "staff" || r === "admin" || r === "owner") return r;
  return null;
}

export function hasMinStoreRole(
  role: string | null | undefined,
  minRole: StoreMemberRole,
): boolean {
  const normalized = normalizeStoreRole(role);
  if (!normalized) return false;
  return ROLE_RANK[normalized] >= ROLE_RANK[minRole];
}

export function isAdminOrOwnerRole(role: string | null | undefined): boolean {
  return hasMinStoreRole(role, "admin");
}

export function isOwnerRole(role: string | null | undefined): boolean {
  return normalizeStoreRole(role) === "owner";
}
