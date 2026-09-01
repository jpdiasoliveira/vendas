import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { storefrontInputClass } from "@/react-app/design-system/inputStyles";
import { formatDateTime } from "@/react-app/utils/format";
import type { StoreCoupon } from "@/react-app/types";
import {
  adminCouponFormSchema,
  couponToFormValues,
  type AdminCouponFormValues,
} from "@/schemas/adminCouponForm";

type AdminCouponsListProps = {
  coupons: StoreCoupon[];
  loading: boolean;
  editingId: string | null;
  updatingId: string | null;
  onEdit: (coupon: StoreCoupon) => void;
  onCancelEdit: () => void;
  onSave: (couponId: string, values: AdminCouponFormValues) => Promise<void>;
  onDelete: (coupon: StoreCoupon) => void;
};

function discountLabel(coupon: StoreCoupon): string {
  return coupon.discountType === "percent"
    ? `${coupon.discountValue}%`
    : `R$ ${coupon.discountValue.toFixed(2)}`;
}

function CouponEditForm({
  coupon,
  saving,
  onCancel,
  onSubmit,
}: {
  coupon: StoreCoupon;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: AdminCouponFormValues) => Promise<void>;
}) {
  const form = useForm<AdminCouponFormValues>({
    resolver: zodResolver(adminCouponFormSchema),
    defaultValues: couponToFormValues(coupon),
  });

  useEffect(() => {
    form.reset(couponToFormValues(coupon));
  }, [coupon, form]);

  const discountType = form.watch("discountType");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <input className={storefrontInputClass} {...form.register("code")} aria-label="Código" />
      <select className={storefrontInputClass} {...form.register("discountType")} aria-label="Tipo">
        <option value="percent">Percentual (%)</option>
        <option value="fixed">Valor fixo (R$)</option>
      </select>
      <input
        type="number"
        className={storefrontInputClass}
        {...form.register("discountValue", { valueAsNumber: true })}
        aria-label="Valor"
      />
      <input type="datetime-local" className={storefrontInputClass} {...form.register("validFrom")} aria-label="Início" />
      <input type="datetime-local" className={storefrontInputClass} {...form.register("validUntil")} aria-label="Fim" />
      <label className="inline-flex items-center gap-2 text-sm text-content">
        <input type="checkbox" {...form.register("active")} />
        Ativo
      </label>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-brand-primary/15 px-3 py-2 text-sm">
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
      {discountType === "percent" && form.formState.errors.discountValue ? (
        <p className="text-sm text-red-300 sm:col-span-3">{form.formState.errors.discountValue.message}</p>
      ) : null}
    </form>
  );
}

export function AdminCouponsList({
  coupons,
  loading,
  editingId,
  updatingId,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: AdminCouponsListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (coupons.length === 0) {
    return <p className="py-8 text-center text-sm text-content-muted">Nenhum cupom cadastrado.</p>;
  }

  return (
    <ul className="divide-y divide-brand-primary/10 rounded-2xl border border-brand-primary/10">
      {coupons.map((coupon) => (
        <li key={coupon.id} className="flex flex-col gap-3 px-4 py-4">
          {editingId === coupon.id ? (
            <CouponEditForm
              coupon={coupon}
              saving={updatingId === coupon.id}
              onCancel={onCancelEdit}
              onSubmit={(values) => onSave(coupon.id, values)}
            />
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium uppercase tracking-wide text-content">{coupon.code}</p>
                <p className="text-sm text-content-muted">
                  {discountLabel(coupon)} · {coupon.active ? "ativo" : "inativo"} · até{" "}
                  {formatDateTime(coupon.validUntil)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(coupon)}
                  className="inline-flex items-center gap-1 rounded-xl border border-brand-primary/15 bg-surface-elevated px-3 py-2 text-sm text-content hover:bg-surface-muted"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(coupon)}
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
