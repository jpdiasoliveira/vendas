import { useFormContext } from "react-hook-form";
import type { AdminProductFormValues } from "@/schemas/adminProductForm";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";

export function AdminProductInventoryTab() {
  const { register, formState: { errors } } = useFormContext<AdminProductFormValues>();

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-content-muted" htmlFor="product-stock">
          Estoque
        </label>
        <input id="product-stock" type="number" min={0} step={1} {...register("stock", { valueAsNumber: true })} className={storefrontInputClass} />
        {errors.stock ? <p className="mt-1 text-sm text-red-300">{errors.stock.message}</p> : null}
      </div>
      <p className="text-sm text-content-muted">
        Produtos com estoque ≤ 5 unidades aparecem destacados na tabela como críticos.
      </p>
    </div>
  );
}
