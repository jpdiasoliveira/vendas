import { useEffect, useState } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { adminApiFetch } from "@/react-app/services/api";

export function isStoreStaffRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const r = role.trim().toLowerCase();
  return r === "admin" || r === "owner" || r === "staff";
}

/**
 * Papel do usuário na loja atual (store_members), via GET /api/admin/me.
 * Se não for membro ou não houver token, role fica null após `ready`.
 */
export function useAdminStoreRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(() => user == null);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setReady(true);
      return;
    }
    setReady(false);
    let cancelled = false;
    adminApiFetch<{ role: string }>("/api/admin/me")
      .then((d) => {
        if (!cancelled) setRole(d.role);
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { role, ready, isStaff: isStoreStaffRole(role) };
}
