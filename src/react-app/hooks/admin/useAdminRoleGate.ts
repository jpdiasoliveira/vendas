import { useAdminMeQuery } from "@/react-app/hooks/useAdminMeQuery";
import {
  hasMinStoreRole,
  isAdminOrOwnerRole,
  isOwnerRole,
  normalizeStoreRole,
  type StoreMemberRole,
} from "@/react-app/utils/adminRole";

export function useAdminRoleGate(minRole: StoreMemberRole = "staff") {
  const { data: me, isLoading, isFetching } = useAdminMeQuery();
  const role = normalizeStoreRole(me?.role);
  const allowed = hasMinStoreRole(me?.role, minRole);

  return {
    role,
    allowed,
    isLoading: isLoading || isFetching,
    isAdminOrOwner: isAdminOrOwnerRole(me?.role),
    isOwner: isOwnerRole(me?.role),
  };
}
