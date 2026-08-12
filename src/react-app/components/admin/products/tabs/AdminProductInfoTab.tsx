import { useFormContext } from "react-hook-form";
import type { AdminProductFormValues } from "@/schemas/adminProductForm";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import { useAdminCategoriesQuery } from "@/react-app/hooks/useAdminCategoriesQuery";

export function AdminProductInfoTab() {
  const { register, formState: { errors } } = useFormContext<AdminProductFormValues>();
  const categoriesQuery = useAdminCategoriesQuery();
  const categories = categoriesQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-content-muted" htmlFor="product-title">
          Nome do produto <span className="text-red-400">*</span>
        </label>
        <input id="product-title" {...register("title")} className={storefrontInputClass} placeholder="Ex.: O Pequeno Príncipe" />
        {errors.title ? <p className="mt-1 text-sm text-red-300">{errors.title.message}</p> : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-content-muted" htmlFor="product-description">
          Descrição
        </label>
        <textarea id="product-description" {...register("description")} rows={4} className={`${storefrontInputClass} resize-y`} placeholder="Detalhes do produto (opcional)" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-content-muted" htmlFor="product-category">
          Categoria
        </label>
        <select id="product-category" {...register("categoryId")} className={storefrontInputClass}>
          <option value="">Selecione (opcional)</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-content-muted" htmlFor="product-status">
          Status inicial
        </label>
        <select id="product-status" {...register("status")} className={storefrontInputClass}>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>
    </div>
  );
}
