import { describe, expect, it } from "vitest";
import {
  canRemoveMember,
  canUpdateMemberRole,
  getDeleteMemberBlockReason,
  getInviteMemberBlockReason,
  getListMembersBlockReason,
  getStaffLimitBlockReason,
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

  it("bloqueia convite quando ator não é owner", () => {
    expect(getInviteMemberBlockReason("staff")).toMatch(/dono/i);
    expect(getInviteMemberBlockReason("admin")).toMatch(/dono/i);
    expect(getInviteMemberBlockReason("owner")).toBeNull();
  });

  it("bloqueia listagem para staff", () => {
    expect(getListMembersBlockReason("staff")).toMatch(/administradores/i);
    expect(getListMembersBlockReason("admin")).toBeNull();
    expect(getListMembersBlockReason("owner")).toBeNull();
  });

  it("bloqueia convite quando limite do plano foi atingido", () => {
    expect(getStaffLimitBlockReason(2, 2)).toMatch(/limite/i);
    expect(getStaffLimitBlockReason(1, 2)).toBeNull();
  });

  it("impede remover owner ou único dono da loja", () => {
    expect(
      getDeleteMemberBlockReason({
        targetRole: "owner",
        targetUserId: "owner-1",
        actorUserId: "owner-1",
        ownerCount: 1,
      }),
    ).toMatch(/único dono/i);

    expect(
      getDeleteMemberBlockReason({
        targetRole: "owner",
        targetUserId: "owner-1",
        actorUserId: "owner-2",
        ownerCount: 2,
      }),
    ).toMatch(/dono da loja/i);

    expect(
      getDeleteMemberBlockReason({
        targetRole: "staff",
        targetUserId: "staff-1",
        actorUserId: "owner-1",
        ownerCount: 1,
      }),
    ).toBeNull();
  });
});
