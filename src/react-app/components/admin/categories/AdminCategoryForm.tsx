import { Loader2, Plus } from "lucide-react";
import { FormProvider } from "react-hook-form";
import { useAdminCategoryForm } from "@/react-app/hooks/admin/useAdminCategoryForm";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import type { AdminCategoryFormValues } from "@/schemas/adminCategoryForm";

type AdminCategoryFormProps = {
  creating: boolean;
  onSubmit: (values: AdminCategoryFormValues) => Promise<void>;
};

export function AdminCategoryForm({ creating, onSubmit }: AdminCategoryFormProps) {
  const form = useAdminCategoryForm();

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    form.reset();
  });

  return (
    <section className="mb-8 rounded-2xl border border-brand-primary/10 bg-surface-muted/40 p-4">
      <h2 className="mb-3 text-sm font-semibold text-content">Nova categoria</h2>
      <FormProvider {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs text-content-muted" htmlFor="category-name">
              Nome
            </label>
            <input
              id="category-name"
              {...form.register("name")}
              className={storefrontInputClass}
              placeholder="Ex.: Literatura Clássica"
            />
            {form.formState.errors.name ? (
              <p className="mt-1 text-sm text-red-300">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div className="w-full sm:w-24">
            <label className="mb-1 block text-xs text-content-muted" htmlFor="category-order">
              Ordem
            </label>
            <input
              id="category-order"
              type="number"
              min={0}
              {...form.register("sortOrder", { valueAsNumber: true })}
              className={storefrontInputClass}
            />
            {form.formState.errors.sortOrder ? (
              <p className="mt-1 text-sm text-red-300">{form.formState.errors.sortOrder.message}</p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={creating || !form.watch("name")?.trim()}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar
          </button>
        </form>
      </FormProvider>
    </section>
  );
}
