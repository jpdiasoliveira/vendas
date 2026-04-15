/**
 * Barrel da camada de dados (Repository Pattern).
 * Rotas continuam importando de `../core/database.js`; implementação em `./db/*`.
 */

export * from "./db/storesRepo.js";
export * from "./db/categoriesRepo.js";
export * from "./db/productsRepo.js";
export * from "./db/ordersRepo.js";
export * from "./db/membersRepo.js";
export * from "./db/auditRepo.js";
