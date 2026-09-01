import { Loader2, Trash2 } from "lucide-react";
import type { StoreMemberListItem } from "@/react-app/types";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import { formatDate } from "@/react-app/utils/format";

const roleLabel = (role: string) => {
  const r = role.trim().toLowerCase();
  if (r === "owner") return "Dono";
  if (r === "admin") return "Admin";
  return "Staff";
};

type AdminStoreMembersListProps = {
  members: StoreMemberListItem[];
  loading: boolean;
  updatingId: string | null;
  currentUserId: string | null;
  onRoleChange: (memberId: string, role: "staff" | "admin") => void;
  onDelete: (member: StoreMemberListItem) => void;
};

export function AdminStoreMembersList({
  members,
  loading,
  updatingId,
  currentUserId,
  onRoleChange,
  onDelete,
}: AdminStoreMembersListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-content-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-brand-primary" aria-hidden />
        Carregando equipe…
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-primary/10 bg-surface-elevated p-8 text-center text-content-muted">
        Nenhum membro cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-primary/10 bg-surface-elevated">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-primary/10 bg-surface-muted/60">
              <th className="px-4 py-3 text-left text-sm font-semibold text-content">Nome / e-mail</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-content">Papel</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-content">Desde</th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isOwner = member.role.trim().toLowerCase() === "owner";
              const busy = updatingId === member.id;
              return (
                <tr key={member.id} className="border-b border-brand-primary/5 hover:bg-surface-muted/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-content">{member.email || "—"}</p>
                    {member.userId === currentUserId ? (
                      <p className="text-xs text-content-muted">Você</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {isOwner ? (
                      <span className="inline-flex rounded-full bg-brand-primary/15 px-3 py-1 text-xs font-semibold text-brand-primary">
                        {roleLabel(member.role)}
                      </span>
                    ) : (
                      <select
                        value={member.role === "admin" ? "admin" : "staff"}
                        disabled={busy}
                        onChange={(e) => onRoleChange(member.id, e.target.value as "staff" | "admin")}
                        className={`${storefrontInputClass} min-h-[40px] py-2 text-sm`}
                        aria-label={`Papel de ${member.email}`}
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-content-muted">{formatDate(member.createdAt)}</td>
                  <td className="px-4 py-3">
                    {!isOwner ? (
                      <button
                        type="button"
                        onClick={() => onDelete(member)}
                        className="rounded-lg p-2 text-red-300 hover:bg-red-950/30"
                        title="Remover membro"
                        aria-label={`Remover ${member.email}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
