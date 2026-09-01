import { describe, expect, it } from "vitest";
import { storeMemberInviteSchema, storeMemberUpdateSchema } from "./storeMember";

describe("storeMemberInviteSchema", () => {
  it("aceita convite válido", () => {
    const parsed = storeMemberInviteSchema.parse({
      email: "staff@example.com",
      role: "staff",
      full_name: "Staff Demo",
    });
    expect(parsed.role).toBe("staff");
  });

  it("rejeita owner como papel convidado", () => {
    const result = storeMemberInviteSchema.safeParse({
      email: "x@example.com",
      role: "owner",
    });
    expect(result.success).toBe(false);
  });
});

describe("storeMemberUpdateSchema", () => {
  it("aceita troca entre staff e admin", () => {
    expect(storeMemberUpdateSchema.parse({ role: "admin" }).role).toBe("admin");
  });
});
