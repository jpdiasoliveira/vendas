import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import { formatCurrency } from "@/react-app/utils/format";
import { formatCepDigits, maskCepInput } from "@/react-app/utils/cepBr";
import type { ShippingFareBand } from "@/react-app/types";
import {
  adminShippingFareBandFormSchema,
  shippingFareBandToFormValues,
  type AdminShippingFareBandFormValues,
} from "@/schemas/adminShippingFareBandForm";

type AdminShippingFareBandsListProps = {
  bands: ShippingFareBand[];
  loading: boolean;
  editingId: string | null;
  updatingId: string | null;
  onEdit: (band: ShippingFareBand) => void;
  onCancelEdit: () => void;
  onSave: (bandId: string, values: AdminShippingFareBandFormValues) => Promise<void>;
  onDelete: (band: ShippingFareBand) => void;
};

function BandEditForm({
  band,
  saving,
  onCancel,
  onSubmit,
}: {
  band: ShippingFareBand;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: AdminShippingFareBandFormValues) => Promise<void>;
}) {
  const form = useForm<AdminShippingFareBandFormValues>({
    resolver: zodResolver(adminShippingFareBandFormSchema),
    defaultValues: shippingFareBandToFormValues(band),
  });

  useEffect(() => {
    form.reset(shippingFareBandToFormValues(band));
  }, [band, form]);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-5"
    >
      <input
        className={storefrontInputClass}
        value={form.watch("cepFrom")}
        onChange={(e) => form.setValue("cepFrom", maskCepInput(e.target.value), { shouldValidate: true })}
        aria-label="CEP inicial"
      />
      <input
        className={storefrontInputClass}
        value={form.watch("cepTo")}
        onChange={(e) => form.setValue("cepTo", maskCepInput(e.target.value), { shouldValidate: true })}
        aria-label="CEP final"
      />
      <input
        type="number"
        min={0}
        step="0.01"
        className={storefrontInputClass}
        {...form.register("amountBrl", { valueAsNumber: true })}
        aria-label="Valor do frete"
      />
      <input className={storefrontInputClass} {...form.register("label")} aria-label="Rótulo" />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-brand-primary/15 px-3 py-2 text-sm text-content-muted"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-brand-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Salvar"}
        </button>
      </div>
    </form>
  );
}

export function AdminShippingFareBandsList({
  bands,
  loading,
  editingId,
  updatingId,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: AdminShippingFareBandsListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (bands.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-content-muted">
        Nenhuma faixa cadastrada. O checkout não conseguirá cotar frete até você adicionar ao menos uma.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-brand-primary/10 rounded-2xl border border-brand-primary/10">
      {bands.map((band) => (
        <li key={band.id} className="flex flex-col gap-3 px-4 py-4">
          {editingId === band.id ? (
            <BandEditForm
              band={band}
              saving={updatingId === band.id}
              onCancel={onCancelEdit}
              onSubmit={(values) => onSave(band.id, values)}
            />
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-content">
                  {formatCepDigits(band.cepFrom)} — {formatCepDigits(band.cepTo)}
                </p>
                <p className="text-sm text-content-muted">
                  {formatCurrency(band.amountBrl)}
                  {band.label ? ` · ${band.label}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(band)}
                  className="inline-flex items-center gap-1 rounded-xl border border-brand-primary/15 bg-surface-elevated px-3 py-2 text-sm text-content hover:bg-surface-muted"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(band)}
                  className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-200 hover:bg-red-950/40"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Excluir
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
