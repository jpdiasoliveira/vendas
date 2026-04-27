/**
 * Frete por CEP: faixas em `store_shipping_fare_bands` (ver docs/supabase-store-shipping-fare-bands.sql).
 * O valor efetivo é sempre decidido no Worker — o cliente só sugere o CEP.
 */

import { getSupabase } from "../supabase.js";

/** CEP brasileiro: só dígitos, exatamente 8 posições (evita ambiguidade no cálculo de faixa). */
export const normalizeBrazilCep = (raw: string | null | undefined): string | null => {
  const d = String(raw ?? "").replace(/\D/g, "");
  return d.length === 8 ? d : null;
};

export type ShippingQuoteResult =
  | { deliverable: true; fee: number; bandLabel?: string | null }
  | { deliverable: false; message: string };

export const resolveShippingFeeForCep = async (
  env: Env,
  storeId: string,
  cep8: string
): Promise<ShippingQuoteResult> => {
  if (!/^\d{8}$/.test(cep8)) {
    return { deliverable: false, message: "CEP inválido. Use 8 dígitos." };
  }
  const cepNum = Number.parseInt(cep8, 10);
  const supabase = getSupabase(env);
  const { data: bands, error } = await supabase
    .from("store_shipping_fare_bands")
    .select("cep_from, cep_to, amount_brl, label")
    .eq("store_id", storeId)
    .order("cep_from", { ascending: true });

  if (error) throw new Error(error.message);
  const rows = bands ?? [];
  if (rows.length === 0) {
    return {
      deliverable: false,
      message: "A loja ainda não configurou entregas por CEP. Entre em contato com o suporte.",
    };
  }
  for (const r of rows) {
    const from = Number((r as { cep_from: unknown }).cep_from);
    const to = Number((r as { cep_to: unknown }).cep_to);
    if (Number.isFinite(from) && Number.isFinite(to) && cepNum >= from && cepNum <= to) {
      const fee = Number((r as { amount_brl: unknown }).amount_brl);
      const label = (r as { label?: unknown }).label;
      return {
        deliverable: true,
        fee: Number.isFinite(fee) && fee >= 0 ? fee : 0,
        bandLabel: typeof label === "string" ? label : null,
      };
    }
  }
  return { deliverable: false, message: "Não entregamos neste CEP no momento." };
};
