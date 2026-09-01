import { describe, expect, it } from "vitest";
import { getProductPublicPath, productHasPublicPath } from "./productPublicPath";

describe("getProductPublicPath", () => {
  it("monta URL com slug codificado", () => {
    expect(getProductPublicPath("camiseta-basica-123")).toBe("/produto/camiseta-basica-123");
  });
});

describe("productHasPublicPath", () => {
  it("retorna true quando slug existe", () => {
    expect(productHasPublicPath({ slug: "item-1" })).toBe(true);
  });

  it("retorna false para slug vazio", () => {
    expect(productHasPublicPath({ slug: "  " })).toBe(false);
  });
});
