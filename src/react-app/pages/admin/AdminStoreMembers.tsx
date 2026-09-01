import { useEffect } from "react";
import { RefreshCw, Users } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { AdminStoreMemberDeleteModal } from "@/react-app/components/admin/members/AdminStoreMemberDeleteModal";
import { AdminStoreMemberInviteForm } from "@/react-app/components/admin/members/AdminStoreMemberInviteForm";
import { AdminStoreMembersList } from "@/react-app/components/admin/members/AdminStoreMembersList";
import { useAdminStoreMembers } from "@/react-app/hooks/admin/useAdminStoreMembers";

const AdminStoreMembersPage = () => {
  const m = useAdminStoreMembers();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Equipe — Admin";
  }, []);

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-9 w-9 shrink-0 text-brand-primary sm:h-10 sm:w-10" aria-hidden />
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-content sm:text-4xl">Equipe da loja</h1>
            <p className="mt-0.5 text-sm text-content-muted">Convide staff e administradores para operar o painel.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void m.fetchMembers()}
          disabled={m.loading}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-brand-primary/20 bg-surface-elevated px-3 py-2 text-sm font-medium text-content-muted transition hover:bg-surface-muted hover:text-content disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 shrink-0 ${m.refetching ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {m.error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">{m.error}</div>
      ) : null}

      <AdminStoreMemberInviteForm inviting={m.inviting} onSubmit={m.handleInvite} />
      <AdminStoreMembersList
        members={m.members}
        loading={m.loading}
        updatingId={m.updatingId}
        currentUserId={user?.id ?? null}
        onRoleChange={(memberId, role) => void m.handleRoleChange(memberId, role)}
        onDelete={m.setDeleteTarget}
      />

      {m.deleteTarget ? (
        <AdminStoreMemberDeleteModal
          isOpen
          email={m.deleteTarget.email}
          removing={m.removingId === m.deleteTarget.id}
          onClose={() => m.setDeleteTarget(null)}
          onConfirm={() => void m.handleRemove(m.deleteTarget!.id)}
        />
      ) : null}
    </div>
  );
};

export default AdminStoreMembersPage;
