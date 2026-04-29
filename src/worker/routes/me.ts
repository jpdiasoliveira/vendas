import { Hono } from "hono";
import { verifyJwtOnly } from "../middlewares/verifyJwtOnly.js";
import { listActiveStoreMembershipsForUser } from "../core/database.js";
import type { Variables } from "../types.js";
import { logServerError } from "../utils/safeApiError.js";

const me = new Hono<{ Bindings: Env; Variables: Variables }>();

me.use("*", verifyJwtOnly);

/**
 * Lojas em que o utilizador do JWT tem papel de staff (owner/admin/staff).
 * Não exige x-store-slug — usado após login para alinhar o tenant em localhost.
 */
me.get("/staff-stores", async (c) => {
  const userId = c.get("jwtSubject");
  if (!userId) {
    return c.json({ success: false, error: "Sessão inválida" }, 401);
  }
  try {
    const stores = await listActiveStoreMembershipsForUser(c.env, userId);
    return c.json({ success: true, data: { stores } }, 200);
  } catch (err: unknown) {
    logServerError("me.get /staff-stores", err);
    return c.json({ success: false, error: "Erro ao listar lojas do utilizador" }, 500);
  }
});

export default me;
