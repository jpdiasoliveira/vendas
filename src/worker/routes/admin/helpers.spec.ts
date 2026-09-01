import { describe, expect, it } from "vitest";
import { requireAdminOrOwner, requireOwner } from "./helpers.js";

const mockContext = (user: { id: string; role: string } | undefined) => ({
  get: (key: string) => (key === "user" ? user : undefined),
});

describe("admin route helpers", () => {
  describe("requireAdminOrOwner", () => {
    it("permite admin e owner", () => {
      expect(requireAdminOrOwner(mockContext({ id: "1", role: "admin" }))?.role).toBe("admin");
      expect(requireAdminOrOwner(mockContext({ id: "2", role: "owner" }))?.role).toBe("owner");
      expect(requireAdminOrOwner(mockContext({ id: "3", role: "OWNER" }))?.role).toBe("OWNER");
    });

    it("nega staff e ausência de usuário", () => {
      expect(requireAdminOrOwner(mockContext({ id: "4", role: "staff" }))).toBeNull();
      expect(requireAdminOrOwner(mockContext(undefined))).toBeNull();
    });
  });

  describe("requireOwner", () => {
    it("permite somente owner", () => {
      expect(requireOwner(mockContext({ id: "1", role: "owner" }))?.id).toBe("1");
      expect(requireOwner(mockContext({ id: "2", role: "OWNER" }))?.id).toBe("2");
    });

    it("nega admin, staff e ausência de usuário", () => {
      expect(requireOwner(mockContext({ id: "3", role: "admin" }))).toBeNull();
      expect(requireOwner(mockContext({ id: "4", role: "staff" }))).toBeNull();
      expect(requireOwner(mockContext(undefined))).toBeNull();
    });
  });
});
