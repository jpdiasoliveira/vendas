import { z } from "zod";
import type { ShippingFareBand } from "@/contracts/schema";
import {
  shippingFareBandCreateSchema,
  shippingFareBandUpdateSchema,
  type ShippingFareBandCreateInput,
  type ShippingFareBandUpdateInput,
} from "@/schemas/shippingFareBand";
import { formatCepDigits } from "@/react-app/utils/cepBr";

export const adminShippingFareBandFormSchema = z.object({
  cepFrom: z.string().min(1, "CEP inicial é obrigatório."),
  cepTo: z.string().min(1, "CEP final é obrigatório."),
  amountBrl: z.coerce.number().finite().nonnegative("Valor do frete inválido."),
  label: z.string().max(120).optional(),
});

export type AdminShippingFareBandFormValues = z.infer<typeof adminShippingFareBandFormSchema>;

export const defaultAdminShippingFareBandFormValues: AdminShippingFareBandFormValues = {
  cepFrom: "",
  cepTo: "",
  amountBrl: 0,
  label: "",
};

export function shippingFareBandToFormValues(band: ShippingFareBand): AdminShippingFareBandFormValues {
  return {
    cepFrom: formatCepDigits(band.cepFrom),
    cepTo: formatCepDigits(band.cepTo),
    amountBrl: band.amountBrl,
    label: band.label ?? "",
  };
}

export function formValuesToCreateShippingPayload(
  values: AdminShippingFareBandFormValues,
): ShippingFareBandCreateInput {
  return shippingFareBandCreateSchema.parse({
    cep_from: values.cepFrom,
    cep_to: values.cepTo,
    amount_brl: values.amountBrl,
    label: values.label?.trim() || null,
  });
}

export function formValuesToUpdateShippingPayload(
  values: AdminShippingFareBandFormValues,
): ShippingFareBandUpdateInput {
  return shippingFareBandUpdateSchema.parse({
    cep_from: values.cepFrom,
    cep_to: values.cepTo,
    amount_brl: values.amountBrl,
    label: values.label?.trim() || null,
  });
}
