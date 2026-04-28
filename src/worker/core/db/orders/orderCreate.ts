/**
 * Criação de pedido (itens + frete + cupom) com totais decididos no servidor.
 * Persistência atômica via RPC `create_order_with_stock_lock` (reserva de estoque + idempotência).
 */

import { getSupabase } from "../../supabase.js";
import type { CartItemPayload } from "../../schema.js";
import {
  resolveOrderLinesForCheckout,
  type ResolvedCheckoutLine,
} from "../productsRepo.js";
import { normalizeBrazilCep, resolveShippingFeeForCep } from "../shippingRepo.js";
import { validateCouponForSubtotal } from "../couponsRepo.js";
import { OrderBusinessError } from "../../orderErrors.js";

const roundMoney = (n: number): number => Math.round(n * 100) / 100;

export type CreateOrderResult = {
  orderId: string;
  total: number;
  shippingPostalCode: string;
  /** true quando a mesma Idempotency-Key já havia criado o pedido (sem novo e-mail). */
  idempotent: boolean;
};

export async function createOrder(
  env: Env,
  params: {
    storeId: string;
    userId: string | null;
    items: CartItemPayload[];
    resolvedLines?: ResolvedCheckoutLine[];
    shippingPostalCode: string;
    couponCode?: string | null;
    customerName?: string | null;
    customerPhone?: string | null;
    deliveryAddress?: string | null;
    guestCheckoutEmail?: string | null;
    /** Obrigatório para deduplicação segura (header Idempotency-Key ou corpo). */
    idempotencyKey: string;
  }
): Promise<CreateOrderResult> {
  const supabase = getSupabase(env);
  const lines =
    params.resolvedLines ??
    (await resolveOrderLinesForCheckout(env, params.storeId, params.items));
  const itemsSubtotal = roundMoney(
    lines.reduce((acc, line) => acc + line.unitPrice * line.quantity, 0)
  );

  const cep8 = normalizeBrazilCep(params.shippingPostalCode);
  if (!cep8) {
    throw new OrderBusinessError("Informe um CEP válido (8 dígitos).");
  }
  const ship = await resolveShippingFeeForCep(env, params.storeId, cep8);
  if (!ship.deliverable) {
    throw new OrderBusinessError(ship.message);
  }
  const fee = roundMoney(ship.fee);

  let couponDiscount = 0;
  let couponCodeStored: string | null = null;
  const rawCoupon = params.couponCode != null ? String(params.couponCode) : "";
  if (rawCoupon.trim() !== "") {
    const v = await validateCouponForSubtotal(env, params.storeId, rawCoupon, itemsSubtotal);
    couponDiscount = v.discountAmount;
    couponCodeStored = v.codeNormalized;
  }

  const total = roundMoney(Math.max(0, itemsSubtotal + fee - couponDiscount));
  if (total < 0.01) {
    throw new OrderBusinessError("Valor total do pedido inválido após descontos.");
  }

  const keyTrim = String(params.idempotencyKey ?? "").trim();
  if (!keyTrim) {
    throw new OrderBusinessError("Identificador de idempotência ausente. Atualize o app e tente novamente.");
  }

  const lineItemsJson = lines.map((line) => ({
    product_id: line.id,
    product_name: line.name || "Produto",
    product_image: line.image ?? null,
    quantity: line.quantity,
    price: line.unitPrice,
  }));

  const { data, error } = await supabase.rpc("create_order_with_stock_lock", {
    p_store_id: params.storeId,
    p_idempotency_key: keyTrim,
    p_user_id: params.userId,
    p_total: total,
    p_currency: "BRL",
    p_shipping_postal_code: cep8,
    p_shipping_fee: fee,
    p_coupon_code: couponCodeStored ?? "",
    p_coupon_discount: couponDiscount,
    p_guest_checkout_email: params.guestCheckoutEmail ?? "",
    p_customer_name: params.customerName ?? "",
    p_customer_phone: params.customerPhone ?? "",
    p_delivery_address: params.deliveryAddress ?? "",
    p_line_items: lineItemsJson,
  });

  if (error) {
    const m = error.message ?? String(error);
    if (m.includes("INSUFFICIENT_STOCK") || m.includes("P0001")) {
      throw new OrderBusinessError(
        "Um ou mais itens ficaram sem estoque no momento da finalização. Atualize o carrinho e tente novamente."
      );
    }
    if (m.includes("PRODUCT_NOT_FOUND") || m.includes("INVALID_LINE")) {
      throw new OrderBusinessError("Produto inválido ou indisponível. Atualize a página e tente novamente.");
    }
    if (m.includes("create_order_with_stock_lock") || m.includes("schema cache")) {
      throw new OrderBusinessError(
        "Servidor de pedidos desatualizado. Aplique a migração SQL `docs/supabase-create-order-stock-lock-idempotency.sql` no Supabase."
      );
    }
    throw new Error(m);
  }

  const payload = data as { order_id?: string; idempotent?: boolean; shipping_postal_code?: string } | null;
  const oid = payload?.order_id != null ? String(payload.order_id).trim() : "";
  if (!oid) {
    throw new Error("Resposta inesperada da criação de pedido (RPC).");
  }

  return {
    orderId: oid,
    total,
    shippingPostalCode: String(payload?.shipping_postal_code ?? cep8),
    idempotent: payload?.idempotent === true,
  };
}
