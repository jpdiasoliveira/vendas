import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Variables } from "../../types.js";

const mockCountStaffAndAdminMembersByStore = vi.fn();
const mockGetStoreCapabilities = vi.fn();
const mockGetMemberByIdAndStore = vi.fn();
const mockCountOwnersByStore = vi.fn();

vi.mock("../../core/database.js", () => ({
  listMembersByStore: vi.fn(async () => []),
  countStaffAndAdminMembersByStore: (...args: unknown[]) => mockCountStaffAndAdminMembersByStore(...args),
  getStoreCapabilities: (...args: unknown[]) => mockGetStoreCapabilities(...args),
  getMemberByIdAndStore: (...args: unknown[]) => mockGetMemberByIdAndStore(...args),
  countOwnersByStore: (...args: unknown[]) => mockCountOwnersByStore(...args),
  getMemberByUserAndStore: vi.fn(),
  insertStoreMember: vi.fn(),
  updateStoreMemberRole: vi.fn(),
  deleteStoreMember: vi.fn(),
}));

vi.mock("../../core/auth/resolveOrInviteAuthUser.js", () => ({
  resolveOrInviteAuthUser: vi.fn(),
}));

vi.mock("../../core/supabase.js", () => ({
  getSupabase: vi.fn(() => ({
    auth: {
      admin: {
        getUserById: vi.fn(async () => ({ data: { user: { email: "member@example.com" } } })),
      },
    },
  })),
}));

vi.mock("../../utils/audit.js", () => ({
  logAction: vi.fn(async () => undefined),
}));

import { registerAdminMemberRoutes } from "./members.js";

const demoStore = {
  id: "store-1",
  slug: "demo-store",
  displayName: "Demo Store",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function buildApp(user: { id: string; role: string }) {
  const app = new Hono<{ Bindings: Env; Variables: Variables }>();
  app.use("*", async (c, next) => {
    c.set("store", demoStore);
    c.set("user", user);
    await next();
  });
  registerAdminMemberRoutes(app);
  return app;
}

describe("registerAdminMemberRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStoreCapabilities.mockResolvedValue({
      maxProducts: null,
      staffMembersLimit: 2,
      customDomain: false,
      advancedAnalytics: false,
      hasActiveSubscription: true,
    });
  });

  it("retorna 403 quando staff tenta convidar membro", async () => {
    const app = buildApp({ id: "staff-1", role: "staff" });
    const res = await app.request("/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "novo@example.com", role: "staff", full_name: "Novo" }),
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/dono/i);
    expect(mockCountStaffAndAdminMembersByStore).not.toHaveBeenCalled();
  });

  it("retorna 403 quando owner atinge limite staff_members_limit", async () => {
    mockCountStaffAndAdminMembersByStore.mockResolvedValue(2);
    const app = buildApp({ id: "owner-1", role: "owner" });
    const res = await app.request("/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "novo@example.com", role: "staff", full_name: "Novo" }),
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.error).toMatch(/limite/i);
    expect(mockGetStoreCapabilities).toHaveBeenCalled();
  });

  it("retorna 403 ao tentar remover o único owner", async () => {
    mockGetMemberByIdAndStore.mockResolvedValue({
      id: "member-owner",
      userId: "owner-1",
      storeId: "store-1",
      role: "owner",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    mockCountOwnersByStore.mockResolvedValue(1);

    const app = buildApp({ id: "owner-1", role: "owner" });
    const res = await app.request("/members/member-owner", { method: "DELETE" });

    expect(res.status).toBe(403);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.error).toMatch(/único dono|dono da loja/i);
  });

  it("retorna 403 quando staff tenta listar equipe", async () => {
    const app = buildApp({ id: "staff-1", role: "staff" });
    const res = await app.request("/members", { method: "GET" });

    expect(res.status).toBe(403);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.error).toMatch(/administradores/i);
  });
});
