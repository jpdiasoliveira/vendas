# Arquitetura

> **Documentação canônica para agentes e desenvolvimento:** [`.agents/docs/architecture.md`](.agents/docs/architecture.md)

Este arquivo mantém contexto histórico. Em caso de divergência, prevalece `.agents/docs/`.

---

## Resumo rápido

- **Monorepo:** `src/worker` (Hono) + `src/react-app` (Vite/React) + `src/contracts` (tipos compartilhados).
- **Tenant:** header `x-store-slug` → tabela `stores` → `store_id` em todas as queries.
- **API:** envelope `{ success, data?, error? }` — ver [`docs/api-contract.md`](docs/api-contract.md).
- **Dados:** Supabase PostgreSQL; repos em `src/worker/core/db/`.

Para detalhes de pastas, fluxos e módulos, abra [`.agents/docs/architecture.md`](.agents/docs/architecture.md).
