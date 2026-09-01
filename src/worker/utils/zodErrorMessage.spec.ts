import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zodErrorToMessage } from "./zodErrorMessage";

describe("zodErrorToMessage", () => {
  it("concatena mensagens com caminho do campo", () => {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse({ email: "invalido" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(zodErrorToMessage(parsed.error)).toContain("email:");
    }
  });

  it("retorna fallback quando não há issues", () => {
    expect(zodErrorToMessage({ issues: [] })).toBe("Dados inválidos.");
  });
});
