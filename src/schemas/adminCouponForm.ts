import { z } from "zod";
import type { StoreCoupon } from "@/contracts/schema";
import { couponCreateSchema, couponUpdateSchema, type CouponCreateInput, type CouponUpdateInput } from "@/schemas/coupon";

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function datetimeLocalToIso(local: string): string {
  return new Date(local).toISOString();
}

export const adminCouponFormSchema = z
  .object({
    code: z.string().trim().min(1, "Código é obrigatório.").max(64),
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.coerce.number().finite().positive("Valor deve ser maior que zero."),
    validFrom: z.string().min(1, "Data de início é obrigatória."),
    validUntil: z.string().min(1, "Data de validade é obrigatória."),
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === "percent" && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentual não pode ser maior que 100.",
        path: ["discountValue"],
      });
    }
  });

export type AdminCouponFormValues = z.infer<typeof adminCouponFormSchema>;

export const defaultAdminCouponFormValues = (): AdminCouponFormValues => {
  const now = new Date();
  const inOneYear = new Date(now.getTime() + 365 * 86400000);
  return {
    code: "",
    discountType: "percent",
    discountValue: 10,
    validFrom: isoToDatetimeLocal(now.toISOString()),
    validUntil: isoToDatetimeLocal(inOneYear.toISOString()),
    active: true,
  };
};

export function couponToFormValues(coupon: StoreCoupon): AdminCouponFormValues {
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    validFrom: isoToDatetimeLocal(coupon.validFrom),
    validUntil: isoToDatetimeLocal(coupon.validUntil),
    active: coupon.active,
  };
}

export function formValuesToCreateCouponPayload(values: AdminCouponFormValues): CouponCreateInput {
  return couponCreateSchema.parse({
    code: values.code.trim(),
    discount_type: values.discountType,
    discount_value: values.discountValue,
    valid_from: datetimeLocalToIso(values.validFrom),
    valid_until: datetimeLocalToIso(values.validUntil),
    active: values.active,
  });
}

export function formValuesToUpdateCouponPayload(values: AdminCouponFormValues): CouponUpdateInput {
  return couponUpdateSchema.parse({
    code: values.code.trim(),
    discount_type: values.discountType,
    discount_value: values.discountValue,
    valid_from: datetimeLocalToIso(values.validFrom),
    valid_until: datetimeLocalToIso(values.validUntil),
    active: values.active,
  });
}
