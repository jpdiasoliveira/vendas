import { describe, expect, it } from "vitest";
import {
  cartItemPayloadSchema,
  couponValidateBodySchema,
  createOrderBodySchema,
  orderPaymentBodySchema,
} from "./orderPublic";

const validItem = {
  id: "prod-1",
  name: "Produto demo",
  price: 29.9,
  quantity: 1,
};

const validOrderBody = {
  items: [validItem],
  customerPhone: "11999990000",
  deliveryAddress: "Rua Exemplo, 100",
  shippingPostalCode: "01310100",
};

describe("cartItemPayloadSchema", () => {
  it("aceita item de carrinho válido", () => {
    const result = cartItemPayloadSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it("rejeita quantidade zero", () => {
    const result = cartItemPayloadSchema.safeParse({ ...validItem, quantity: 0 });
    expect(result.success).toBe(false);
  });
});

describe("createOrderBodySchema", () => {
  it("aceita payload mínimo válido", () => {
    const result = createOrderBodySchema.safeParse(validOrderBody);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customerPhone).toBe("11999990000");
      expect(result.data.shippingPostalCode).toBe("01310100");
    }
  });

  it("aceita aliases snake_case", () => {
    const result = createOrderBodySchema.safeParse({
      items: [validItem],
      customer_phone: "11988887777",
      delivery_address: "Av. Paulista, 1000",
      shipping_postal_code: "01310100",
      coupon_code: "PROMO10",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.couponCode).toBe("PROMO10");
    }
  });

  it("rejeita quando telefone está ausente", () => {
    const result = createOrderBodySchema.safeParse({
      items: [validItem],
      deliveryAddress: "Rua Exemplo, 100",
      shippingPostalCode: "01310100",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita quando CEP está ausente", () => {
    const result = createOrderBodySchema.safeParse({
      items: [validItem],
      customerPhone: "11999990000",
      deliveryAddress: "Rua Exemplo, 100",
    });
    expect(result.success).toBe(false);
  });
});

describe("orderPaymentBodySchema", () => {
  it("aceita pix com guest_email", () => {
    const result = orderPaymentBodySchema.safeParse({
      payment_method: "pix",
      guest_email: "cliente@example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.payment_method).toBe("pix");
      expect(result.data.guestEmail).toBe("cliente@example.com");
    }
  });

  it("rejeita método de pagamento inválido", () => {
    const result = orderPaymentBodySchema.safeParse({ payment_method: "boleto" });
    expect(result.success).toBe(false);
  });
});

describe("couponValidateBodySchema", () => {
  it("exige ao menos um item no carrinho", () => {
    const result = couponValidateBodySchema.safeParse({ code: "PROMO10", items: [] });
    expect(result.success).toBe(false);
  });
});
