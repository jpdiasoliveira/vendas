import { Pencil, Trash2 } from "lucide-react";
import type { Category } from "@/react-app/types";
import { AdminCategoryEditForm } from "@/react-app/components/admin/categories/AdminCategoryEditForm";
import type { AdminCategoryFormValues } from "@/schemas/adminCategoryForm";

type AdminCategoryRowProps = {
  category: Category;
  isEditing: boolean;
  saving: boolean;
  onEdit: (category: Category) => void;
  onCancelEdit: () => void;
  onSave: (categoryId: string, values: AdminCategoryFormValues) => Promise<void>;
  onDelete: (category: Category) => void;
};

export function AdminCategoryRow({
  category,
  isEditing,
  saving,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: AdminCategoryRowProps) {
  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      {isEditing ? (
        <AdminCategoryEditForm
          category={category}
          saving={saving}
          onCancel={onCancelEdit}
          onSubmit={(values) => onSave(category.id, values)}
        />
      ) : (
        <>
          <div className="min-w-0">
            <p className="font-medium text-content">{category.name}</p>
            <p className="font-mono text-xs text-content-muted">
              ordem {category.sortOrder ?? 0}
              {category.slug ? ` · ${category.slug}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onEdit(category)}
              className="inline-flex items-center gap-1 rounded-xl border border-brand-primary/15 bg-surface-elevated px-3 py-2 text-sm text-content hover:bg-surface-muted"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Editar
            </button>
            <button
              type="button"
              onClick={() => onDelete(category)}
              className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-200 hover:bg-red-950/40"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Excluir
            </button>
          </div>
        </>
      )}
    </li>
  );
}
