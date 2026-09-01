import { describe, expect, it } from "vitest";
import { formatBrazilPhoneInput } from "./phoneBr";

describe("formatBrazilPhoneInput", () => {
  it("formata celular com 11 dígitos", () => {
    expect(formatBrazilPhoneInput("11999887766")).toBe("(11) 99988-7766");
  });

  it("formata telefone fixo com 10 dígitos", () => {
    expect(formatBrazilPhoneInput("1133334444")).toBe("(11) 3333-4444");
  });

  it("não altera URL do WhatsApp", () => {
    const url = "https://wa.me/5511999887766";
    expect(formatBrazilPhoneInput(url)).toBe(url);
  });

  it("retorna string vazia para entrada vazia", () => {
    expect(formatBrazilPhoneInput("")).toBe("");
  });
});
