import { describe, expect, it } from "vitest";
import {
  canRemoveMember,
  canUpdateMemberRole,
  isInviteableMemberRole,
  wouldExceedStaffLimit,
} from "./storeMemberRules";

describe("storeMemberRules", () => {
  it("aceita papéis convidáveis staff e admin", () => {
    expect(isInviteableMemberRole("staff")).toBe(true);
    expect(isInviteableMemberRole("admin")).toBe(true);
    expect(isInviteableMemberRole("owner")).toBe(false);
  });

  it("impede remover ou alterar owner", () => {
    expect(canRemoveMember("owner")).toBe(false);
    expect(canUpdateMemberRole("owner")).toBe(false);
    expect(canRemoveMember("staff")).toBe(true);
    expect(canUpdateMemberRole("admin")).toBe(true);
  });

  it("respeita limite de equipe do plano", () => {
    expect(wouldExceedStaffLimit(2, 2)).toBe(true);
    expect(wouldExceedStaffLimit(1, 2)).toBe(false);
    expect(wouldExceedStaffLimit(99, null)).toBe(false);
  });
});
