import { describe, expect, it } from "vitest";
import { shippingFareBandCreateSchema } from "./shippingFareBand";

describe("shippingFareBandCreateSchema", () => {
  it("aceita faixa válida com CEP mascarado", () => {
    const result = shippingFareBandCreateSchema.safeParse({
      cep_from: "01310-100",
      cep_to: "01399-999",
      amount_brl: 12.9,
      label: "SP capital",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cep_from).toBe(1310100);
      expect(result.data.cep_to).toBe(1399999);
    }
  });

  it("rejeita quando CEP inicial é maior que o final", () => {
    const result = shippingFareBandCreateSchema.safeParse({
      cep_from: "20000-000",
      cep_to: "10000-000",
      amount_brl: 10,
    });
    expect(result.success).toBe(false);
  });
});
