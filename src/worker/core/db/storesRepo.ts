/**
 * Fachada da camada **loja (tenant)** no Worker.
 *
 * A implementação está dividida por responsabilidade na pasta `./stores/` (SRP).
 * Este ficheiro **só reexporta** símbolos públicos para manter imports estáveis:
 * `import { … } from "../core/database.js"` continua a funcionar sem alterar rotas.
 *
 * Estrutura:
 * - `storeDomainHelpers` — funções puras partilhadas (uso interno pelos outros módulos `stores/*`).
 * - `storeReadRepo` — resolução de loja e leitura de settings.
 * - `storeWriteRepo` — atualização de settings e upsert de domínios.
 * - `storeOnboardingSeed` — seed de catálogo (só importado por `storeProvisioningRepo`).
 * - `storeProvisioningRepo` — criação transacional de loja + assinatura.
 * - `storePlatformListRepo` — listagem para operadores da plataforma.
 */

export {
  getStoreBySlug,
  getStoreByDomain,
  getStoreSettingsWithDisplayName,
} from "./stores/storeReadRepo.js";

export { updateStoreSettingsAndDisplayName, addDomainsToStore } from "./stores/storeWriteRepo.js";

export { createStoreWithOwner, type CreatedStoreResult } from "./stores/storeProvisioningRepo.js";

export { listPlatformStores, type PlatformStoreOverview } from "./stores/storePlatformListRepo.js";
