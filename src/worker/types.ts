import type { Store } from "./core/schema.js";

/**
 * Centralização do contexto de variáveis injetadas em toda request do Hono.
 * Garante Typescript strict mode para os extractors de `c.get()`.
 */
export type Variables = {
  user: unknown;
  store: Store;
};
