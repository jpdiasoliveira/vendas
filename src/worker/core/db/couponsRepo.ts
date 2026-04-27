/**
 * Cupons em `store_coupons` (ver docs/supabase-store-coupons.sql).
 * Sempre validar no servidor no momento de criar o pedido (e opcionalmente em POST /validate).
 */

import { getSupabase } from "../supabase.js";
import { OrderBusinessError } from "../orderErrors.js";

export type CouponValidation = {
  codeNormalized: string;
  discountAmount: number;
  couponId: string;
};

const roundMoney = (n: number): number => Math.round(n * 100) / 100;

export const normalizeCouponCode = (raw: string | null | undefined): string =>
  String(raw ?? "")
    .trim()
    .toLowerCase();

/**
 * Calcula desconto em R$ sobre o subtotal dos itens (sem frete).
 * `nowIso` injetável para testes.
 */
export const validateCouponForSubtotal = async (
  env: Env,
  storeId: string,
  codeRaw: string | null | undefined,
  itemsSubtotal: number,
  nowIso: string = new Date().toISOString()
): Promise<CouponValidation> => {
  const code = normalizeCouponCode(codeRaw);
  if (!code) {
    throw new OrderBusinessError("Informe o código do cupom.");
  }
  if (!Number.isFinite(itemsSubtotal) || itemsSubtotal <= 0) {
    throw new OrderBusinessError("Subtotal inválido para aplicar cupom.");
  }

  const supabase = getSupabase(env);
  const { data: rows, error } = await supabase
    .from("store_coupons")
    .select("id, code, discount_type, discount_value, valid_from, valid_until, active")
    .eq("store_id", storeId)
    .eq("active", true);

  if (error) throw new Error(error.message);

  const now = Date.parse(nowIso);
  const match = (rows ?? []).find(
    (r) => String((r as { code?: unknown }).code ?? "").trim().toLowerCase() === code
  ) as
    | {
        id: string;
        discount_type: string;
        discount_value: number;
        valid_from: string;
        valid_until: string;
      }
    | undefined;

  if (!match) {
    throw new OrderBusinessError("Cupom inválido ou inexistente.");
  }
  const from = Date.parse(match.valid_from);
  const until = Date.parse(match.valid_until);
  if (Number.isFinite(now) && Number.isFinite(from) && now < from) {
    throw new OrderBusinessError("Este cupom ainda não está válido.");
  }
  if (Number.isFinite(now) && Number.isFinite(until) && now > until) {
    throw new OrderBusinessError("Este cupom expirou.");
  }

  const typ = String(match.discount_type).toLowerCase();
  const val = Number(match.discount_value);
  if (!Number.isFinite(val) || val <= 0) {
    throw new OrderBusinessError("Cupom com configuração inválida. Contate o suporte.");
  }

  let discount = 0;
  if (typ === "percent") {
    if (val > 100) throw new OrderBusinessError("Cupom com percentual inválido.");
    discount = roundMoney((itemsSubtotal * val) / 100);
  } else if (typ === "fixed") {
    discount = roundMoney(val);
  } else {
    throw new OrderBusinessError("Tipo de desconto do cupom não suportado.");
  }

  discount = Math.min(discount, roundMoney(itemsSubtotal));
  if (discount <= 0) {
    throw new OrderBusinessError("Este cupom não se aplica ao valor atual do carrinho.");
  }

  return {
    codeNormalized: code,
    discountAmount: discount,
    couponId: String(match.id),
  };
};
