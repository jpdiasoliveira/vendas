import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import {
  adminStoreMemberInviteFormSchema,
  type AdminStoreMemberInviteFormValues,
} from "@/schemas/adminStoreMemberForm";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";

type AdminStoreMemberInviteFormProps = {
  inviting: boolean;
  onSubmit: (values: AdminStoreMemberInviteFormValues) => Promise<void>;
};

const defaultValues: AdminStoreMemberInviteFormValues = {
  email: "",
  fullName: "",
  role: "staff",
};

export function AdminStoreMemberInviteForm({ inviting, onSubmit }: AdminStoreMemberInviteFormProps) {
  const form = useForm<AdminStoreMemberInviteFormValues>({
    resolver: zodResolver(adminStoreMemberInviteFormSchema),
    defaultValues,
  });

  return (
    <form
      className="mb-8 rounded-2xl border border-brand-primary/10 bg-surface-muted/30 p-4 sm:p-5"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
        form.reset(defaultValues);
      })}
    >
      <h2 className="mb-3 font-semibold text-content">Convidar membro</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="member-full-name" className="mb-1 block text-sm font-medium text-content-muted">
            Nome
          </label>
          <input
            id="member-full-name"
            type="text"
            className={storefrontInputClass}
            {...form.register("fullName")}
          />
          {form.formState.errors.fullName ? (
            <p className="mt-1 text-xs text-red-300">{form.formState.errors.fullName.message}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="member-email" className="mb-1 block text-sm font-medium text-content-muted">
            E-mail
          </label>
          <input id="member-email" type="email" className={storefrontInputClass} {...form.register("email")} />
          {form.formState.errors.email ? (
            <p className="mt-1 text-xs text-red-300">{form.formState.errors.email.message}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="member-role" className="mb-1 block text-sm font-medium text-content-muted">
            Papel
          </label>
          <select id="member-role" className={storefrontInputClass} {...form.register("role")}>
            <option value="staff">Staff — operação (pedidos, catálogo, frete, cupons)</option>
            <option value="admin">Admin — inclui vitrine, newsletter e histórico</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={inviting}
        className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {inviting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserPlus className="h-4 w-4" aria-hidden />}
        {inviting ? "Enviando convite…" : "Enviar convite"}
      </button>
    </form>
  );
}
