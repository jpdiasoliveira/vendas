import { useFormContext } from "react-hook-form";
import { ImagePlus, Move } from "lucide-react";
import type { AdminProductFormValues } from "@/schemas/adminProductForm";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";

type AdminProductMediaTabProps = {
  previewUrl: string | null;
  imageUrl: string;
  canReframe: boolean;
  onPickFile: (file: File) => void;
  onReframe: () => void;
};

export function AdminProductMediaTab({ previewUrl, imageUrl, canReframe, onPickFile, onReframe }: AdminProductMediaTabProps) {
  const { register } = useFormContext<AdminProductFormValues>();
  const displaySrc = previewUrl || imageUrl.trim() || "";

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-primary/20 px-4 py-3 transition-colors hover:border-brand-primary/35 hover:bg-surface-muted/50">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onPickFile(file);
          }}
        />
        <ImagePlus className="h-5 w-5 text-content-muted" />
        <span className="text-sm text-content-muted">Escolher arquivo</span>
      </label>
      <p className="text-xs text-content-muted">Após escolher, ajuste o enquadramento 4:5 como na vitrine.</p>
      {displaySrc ? (
        <div className="overflow-hidden rounded-xl border border-brand-primary/15 bg-surface-muted/40">
          <img src={displaySrc} alt="" className="aspect-[4/5] w-full object-cover" />
        </div>
      ) : null}
      {canReframe ? (
        <button type="button" onClick={onReframe} className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/20 bg-surface-elevated px-3 py-2 text-sm font-medium text-content hover:bg-surface-muted">
          <Move className="h-4 w-4" />
          Ajustar posição e zoom
        </button>
      ) : null}
      <div>
        <label className="mb-1 block text-sm font-medium text-content-muted" htmlFor="product-image-url">URL da imagem (opcional)</label>
        <input id="product-image-url" type="url" {...register("imageUrl")} className={storefrontInputClass} placeholder="https://..." />
      </div>
    </div>
  );
}
