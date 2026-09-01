import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import {
  adminCouponFormSchema,
  defaultAdminCouponFormValues,
  type AdminCouponFormValues,
} from "@/schemas/adminCouponForm";

type AdminCouponFormProps = {
  creating: boolean;
  onSubmit: (values: AdminCouponFormValues) => Promise<void>;
};

export function AdminCouponForm({ creating, onSubmit }: AdminCouponFormProps) {
  const form = useForm<AdminCouponFormValues>({
    resolver: zodResolver(adminCouponFormSchema),
    defaultValues: defaultAdminCouponFormValues(),
  });

  const discountType = form.watch("discountType");

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    form.reset(defaultAdminCouponFormValues());
  });

  return (
    <section className="mb-8 rounded-2xl border border-brand-primary/10 bg-surface-muted/40 p-4">
      <h2 className="mb-3 text-sm font-semibold text-content">Novo cupom</h2>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-content-muted" htmlFor="coupon-code">
            Código
          </label>
          <input
            id="coupon-code"
            className={storefrontInputClass}
            {...form.register("code")}
            placeholder="bemvindo10"
          />
          {form.formState.errors.code ? (
            <p className="mt-1 text-sm text-red-300">{form.formState.errors.code.message}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-xs text-content-muted" htmlFor="coupon-type">
            Tipo
          </label>
          <select id="coupon-type" className={storefrontInputClass} {...form.register("discountType")}>
            <option value="percent">Percentual (%)</option>
            <option value="fixed">Valor fixo (R$)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-content-muted" htmlFor="coupon-value">
            {discountType === "percent" ? "Percentual" : "Valor (R$)"}
          </label>
          <input
            id="coupon-value"
            type="number"
            min={0}
            step={discountType === "percent" ? "1" : "0.01"}
            className={storefrontInputClass}
            {...form.register("discountValue", { valueAsNumber: true })}
          />
          {form.formState.errors.discountValue ? (
            <p className="mt-1 text-sm text-red-300">{form.formState.errors.discountValue.message}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-xs text-content-muted" htmlFor="coupon-from">
            Válido de
          </label>
          <input
            id="coupon-from"
            type="datetime-local"
            className={storefrontInputClass}
            {...form.register("validFrom")}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-content-muted" htmlFor="coupon-until">
            Válido até
          </label>
          <input
            id="coupon-until"
            type="datetime-local"
            className={storefrontInputClass}
            {...form.register("validUntil")}
          />
        </div>
        <div className="flex flex-col justify-end gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-content">
            <input type="checkbox" className="rounded" {...form.register("active")} />
            Ativo
          </label>
          <button
            type="submit"
            disabled={creating}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar cupom
          </button>
        </div>
      </form>
    </section>
  );
}
