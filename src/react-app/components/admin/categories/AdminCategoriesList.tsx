import { Loader2 } from "lucide-react";
import type { Category } from "@/react-app/types";
import { AdminCategoryRow } from "@/react-app/components/admin/categories/AdminCategoryRow";
import type { AdminCategoryFormValues } from "@/schemas/adminCategoryForm";

type AdminCategoriesListProps = {
  categories: Category[];
  loading: boolean;
  editingId: string | null;
  updatingId: string | null;
  onEdit: (category: Category) => void;
  onCancelEdit: () => void;
  onSave: (categoryId: string, values: AdminCategoryFormValues) => Promise<void>;
  onDelete: (category: Category) => void;
};

export function AdminCategoriesList({
  categories,
  loading,
  editingId,
  updatingId,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: AdminCategoriesListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (categories.length === 0) {
    return <p className="py-8 text-center text-sm text-content-muted">Nenhuma categoria ainda.</p>;
  }

  return (
    <ul className="divide-y divide-brand-primary/10 rounded-2xl border border-brand-primary/10">
      {categories.map((category) => (
        <AdminCategoryRow
          key={category.id}
          category={category}
          isEditing={editingId === category.id}
          saving={updatingId === category.id}
          onEdit={onEdit}
          onCancelEdit={onCancelEdit}
          onSave={onSave}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
