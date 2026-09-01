import { describe, expect, it } from "vitest";
import { couponCreateSchema } from "./coupon";

describe("couponCreateSchema", () => {
  it("aceita cupom percentual válido", () => {
    const result = couponCreateSchema.safeParse({
      code: "bemvindo10",
      discount_type: "percent",
      discount_value: 10,
      valid_until: "2027-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita percentual acima de 100", () => {
    const result = couponCreateSchema.safeParse({
      code: "invalido",
      discount_type: "percent",
      discount_value: 150,
      valid_until: "2027-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });
});
