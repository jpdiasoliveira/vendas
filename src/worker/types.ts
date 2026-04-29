import type { Store } from "./core/schema.js";

/**
 * Usuário autenticado no painel admin (validado via JWT + store_members).
 * Injetado por verifyAuth em c.set('user', user).
 */
export type AuthUser = {
  id: string;
  role: string;
  /** Preenchido no fluxo de cliente (JWT Supabase). */
  email?: string;
};

/**
 * Variáveis injetadas no contexto Hono (tipagem estrita).
 */
export type Variables = {
  /** Definido nas rotas /api/admin/* após verifyAuth; undefined nas demais. */
  user: AuthUser | unknown;
  /** Injetado pelo storeMiddleware, exceto em rotas skip (ex.: /api/platform/*). */
  store?: Store;
  /** `sub` do JWT Supabase (rotas /api/me/* com verifyJwtOnly, sem tenant). */
  jwtSubject?: string;
};
