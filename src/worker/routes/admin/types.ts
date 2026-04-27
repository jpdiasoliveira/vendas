import type { Hono } from "hono";
import type { Variables } from "../../types.js";

/** Instância Hono das rotas `/api/admin/*` (Bindings + Variables do Worker). */
export type AdminHono = Hono<{ Bindings: Env; Variables: Variables }>;
