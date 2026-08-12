import { useFormContext } from "react-hook-form";
import type { AdminProductFormValues } from "@/schemas/adminProductForm";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";

export function AdminProductPricingTab() {
  const { register, watch, formState: { errors } } = useFormContext<AdminProductFormValues>();
  const wholesaleEnabled = watch("wholesaleEnabled");

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-content-muted" htmlFor="product-price">
          Preço varejo (R$) <span className="text-red-400">*</span>
        </label>
        <input id="product-price" type="number" min={0} step="0.01" {...register("price", { valueAsNumber: true })} className={storefrontInputClass} />
        {errors.price ? <p className="mt-1 text-sm text-red-300">{errors.price.message}</p> : null}
      </div>
      <div className="rounded-xl border border-brand-primary/15 bg-surface-muted/40 p-4">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-content">
          <input type="checkbox" {...register("wholesaleEnabled")} className="rounded border-brand-primary/30" />
          Ativar atacado
        </label>
        {wholesaleEnabled ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-content-muted" htmlFor="product-wholesale-price">Preço atacado (R$)</label>
              <input
                id="product-wholesale-price"
                type="number"
                min={0}
                step="0.01"
                {...register("priceWholesale", {
                  setValueAs: (v) => (v === "" || Number.isNaN(Number(v)) ? null : Number(v)),
                })}
                className={storefrontInputClass}
              />
              {errors.priceWholesale ? <p className="mt-1 text-sm text-red-300">{errors.priceWholesale.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm text-content-muted" htmlFor="product-wholesale-qty">Qtd. mínima</label>
              <input
                id="product-wholesale-qty"
                type="number"
                min={1}
                step={1}
                {...register("minQuantityWholesale", {
                  setValueAs: (v) => (v === "" || Number.isNaN(Number(v)) ? null : Number(v)),
                })}
                className={storefrontInputClass}
              />
              {errors.minQuantityWholesale ? <p className="mt-1 text-sm text-red-300">{errors.minQuantityWholesale.message}</p> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
