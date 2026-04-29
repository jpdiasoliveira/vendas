import { useAuth } from "@/react-app/contexts/AuthContext";
import { useAdminMeQuery } from "@/react-app/hooks/useAdminMeQuery";

export function isStoreStaffRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const r = role.trim().toLowerCase();
  return r === "admin" || r === "owner" || r === "staff";
}

/**
 * Papel do usuário na loja atual (store_members), via GET /api/admin/me (cache TanStack Query).
 * Se não for membro ou não houver token, role fica null após `ready`.
 */
export function useAdminStoreRole() {
  const { user } = useAuth();
  const q = useAdminMeQuery();
  const role = user ? (q.data?.role ?? null) : null;
  const ready = !user || (!q.isPending && (q.isSuccess || q.isError));

  return { role, ready, isStaff: isStoreStaffRole(role) };
}
