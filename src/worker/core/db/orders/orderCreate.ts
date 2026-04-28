/**
 * Criação de pedido (itens + frete + cupom) com totais decididos no servidor.
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
  }
): Promise<{ orderId: string; total: number; shippingPostalCode: string }> {
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

  const orderPayload: Record<string, unknown> = {
    store_id: params.storeId,
    user_id: params.userId,
    total,
    currency: "BRL",
    payment_method: null,
    status: "pending",
    shipping_postal_code: cep8,
    shipping_fee: fee,
    coupon_code: couponCodeStored,
    coupon_discount: couponDiscount,
  };
  if (params.userId == null) {
    const guestEmailTrim =
      params.guestCheckoutEmail != null ? String(params.guestCheckoutEmail).trim() : "";
    if (guestEmailTrim !== "") {
      orderPayload.guest_checkout_email = guestEmailTrim.toLowerCase();
    }
  }
  if (params.customerName != null && String(params.customerName).trim() !== "")
    orderPayload.customer_name = String(params.customerName).trim();
  if (params.customerPhone != null && String(params.customerPhone).trim() !== "")
    orderPayload.customer_phone = String(params.customerPhone).trim();
  if (params.deliveryAddress != null && String(params.deliveryAddress).trim() !== "")
    orderPayload.delivery_address = String(params.deliveryAddress).trim();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(orderPayload)
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  const mappedItems = lines.map((line) => ({
    order_id: order.id,
    store_id: params.storeId,
    product_id: line.id,
    product_name: line.name || "Produto",
    product_image: line.image ?? null,
    quantity: line.quantity,
    price: line.unitPrice,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(mappedItems);
  if (itemsError) throw new Error(itemsError.message);

  return { orderId: String(order.id), total, shippingPostalCode: cep8 };
}
