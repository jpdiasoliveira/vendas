import { describe, expect, it } from "vitest";
import { hasMinStoreRole, isAdminOrOwnerRole, isOwnerRole, normalizeStoreRole } from "./adminRole";

describe("adminRole", () => {
  it("normaliza roles conhecidos", () => {
    expect(normalizeStoreRole("staff")).toBe("staff");
    expect(normalizeStoreRole(" Admin ")).toBe("admin");
    expect(normalizeStoreRole("OWNER")).toBe("owner");
    expect(normalizeStoreRole("platform_operator")).toBeNull();
  });

  it("compara hierarquia staff < admin < owner", () => {
    expect(hasMinStoreRole("staff", "staff")).toBe(true);
    expect(hasMinStoreRole("staff", "admin")).toBe(false);
    expect(hasMinStoreRole("admin", "admin")).toBe(true);
    expect(hasMinStoreRole("owner", "admin")).toBe(true);
  });

  it("expõe helpers de admin e owner", () => {
    expect(isAdminOrOwnerRole("staff")).toBe(false);
    expect(isAdminOrOwnerRole("admin")).toBe(true);
    expect(isOwnerRole("admin")).toBe(false);
    expect(isOwnerRole("owner")).toBe(true);
  });
});
