import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAdminRoleGate } from "@/react-app/hooks/admin/useAdminRoleGate";
import { AdminRestrictedFallback } from "@/react-app/components/admin/AdminRestrictedFallback";
import type { StoreMemberRole } from "@/react-app/utils/adminRole";

type AdminRoleGateProps = {
  minRole: StoreMemberRole;
  message: string;
  children: ReactNode;
};

export function AdminRoleGate({ minRole, message, children }: AdminRoleGateProps) {
  const { allowed, isLoading } = useAdminRoleGate(minRole);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" aria-label="Carregando permissões" />
      </div>
    );
  }

  if (!allowed) {
    return <AdminRestrictedFallback message={message} />;
  }

  return <>{children}</>;
}
