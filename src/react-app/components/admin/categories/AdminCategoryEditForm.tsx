import { Loader2 } from "lucide-react";
import { FormProvider } from "react-hook-form";
import { useAdminCategoryForm } from "@/react-app/hooks/admin/useAdminCategoryForm";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import { categoryToFormValues, type AdminCategoryFormValues } from "@/schemas/adminCategoryForm";
import type { Category } from "@/react-app/types";

type AdminCategoryEditFormProps = {
  category: Category;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: AdminCategoryFormValues) => Promise<void>;
};

export function AdminCategoryEditForm({ category, saving, onCancel, onSubmit }: AdminCategoryEditFormProps) {
  const form = useAdminCategoryForm({ defaultValues: categoryToFormValues(category), resetKey: category.id });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center"
      >
        <input {...form.register("name")} className={`${storefrontInputClass} sm:max-w-xs`} />
        <input
          type="number"
          min={0}
          {...form.register("sortOrder", { valueAsNumber: true })}
          className={`${storefrontInputClass} w-24`}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-brand-primary/15 bg-surface-elevated px-3 py-2 text-sm text-content-muted hover:bg-surface-muted"
          >
            Cancelar
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
