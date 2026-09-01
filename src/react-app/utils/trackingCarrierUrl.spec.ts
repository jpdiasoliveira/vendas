import { describe, expect, it } from "vitest";
import { buildTrackingExternalUrl } from "./trackingCarrierUrl";

describe("buildTrackingExternalUrl", () => {
  it("gera URL dos Correios para código nacional BR", () => {
    const url = buildTrackingExternalUrl("aa123456789br");
    expect(url).toContain("rastreio.correios.com.br");
    expect(url).toContain("AA123456789BR");
  });

  it("usa busca genérica para código desconhecido", () => {
    const url = buildTrackingExternalUrl("TRACK-XYZ");
    expect(url).toContain("google.com/search");
    expect(url).toContain(encodeURIComponent("rastreio TRACK-XYZ"));
  });

  it("retorna vazio para código em branco", () => {
    expect(buildTrackingExternalUrl("   ")).toBe("");
  });
});
