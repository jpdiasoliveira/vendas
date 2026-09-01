import { describe, expect, it } from "vitest";
import { authLoginBodySchema } from "./auth";

describe("authLoginBodySchema", () => {
  it("aceita e-mail e senha válidos", () => {
    const result = authLoginBodySchema.safeParse({
      email: "admin@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    const result = authLoginBodySchema.safeParse({
      email: "nao-e-email",
      password: "secret123",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita senha vazia", () => {
    const result = authLoginBodySchema.safeParse({
      email: "admin@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});
