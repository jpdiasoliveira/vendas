import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import { maskCepInput } from "@/react-app/utils/cepBr";
import {
  adminShippingFareBandFormSchema,
  defaultAdminShippingFareBandFormValues,
  type AdminShippingFareBandFormValues,
} from "@/schemas/adminShippingFareBandForm";

type AdminShippingFareBandFormProps = {
  creating: boolean;
  onSubmit: (values: AdminShippingFareBandFormValues) => Promise<void>;
};

export function AdminShippingFareBandForm({ creating, onSubmit }: AdminShippingFareBandFormProps) {
  const form = useForm<AdminShippingFareBandFormValues>({
    resolver: zodResolver(adminShippingFareBandFormSchema),
    defaultValues: defaultAdminShippingFareBandFormValues,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    form.reset(defaultAdminShippingFareBandFormValues);
  });

  return (
    <section className="mb-8 rounded-2xl border border-brand-primary/10 bg-surface-muted/40 p-4">
      <h2 className="mb-3 text-sm font-semibold text-content">Nova faixa de CEP</h2>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs text-content-muted" htmlFor="band-cep-from">
            CEP inicial
          </label>
          <input
            id="band-cep-from"
            className={storefrontInputClass}
            placeholder="00000-000"
            value={form.watch("cepFrom")}
            onChange={(e) => form.setValue("cepFrom", maskCepInput(e.target.value), { shouldValidate: true })}
          />
          {form.formState.errors.cepFrom ? (
            <p className="mt-1 text-sm text-red-300">{form.formState.errors.cepFrom.message}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-xs text-content-muted" htmlFor="band-cep-to">
            CEP final
          </label>
          <input
            id="band-cep-to"
            className={storefrontInputClass}
            placeholder="99999-999"
            value={form.watch("cepTo")}
            onChange={(e) => form.setValue("cepTo", maskCepInput(e.target.value), { shouldValidate: true })}
          />
          {form.formState.errors.cepTo ? (
            <p className="mt-1 text-sm text-red-300">{form.formState.errors.cepTo.message}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-xs text-content-muted" htmlFor="band-amount">
            Frete (R$)
          </label>
          <input
            id="band-amount"
            type="number"
            min={0}
            step="0.01"
            className={storefrontInputClass}
            {...form.register("amountBrl", { valueAsNumber: true })}
          />
          {form.formState.errors.amountBrl ? (
            <p className="mt-1 text-sm text-red-300">{form.formState.errors.amountBrl.message}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-xs text-content-muted" htmlFor="band-label">
            Rótulo (opcional)
          </label>
          <input id="band-label" className={storefrontInputClass} {...form.register("label")} placeholder="Ex.: SP capital" />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={creating}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar
          </button>
        </div>
      </form>
    </section>
  );
}
