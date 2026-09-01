# Vendas — SaaS multi-loja

Regras para agentes de IA neste repositório. Aplica-se a todo o monorepo (`src/worker` + `src/react-app` + `src/contracts`).

## Sources of truth

1. Solicitação explícita do usuário.
2. [`docs/PRD.md`](docs/PRD.md) — produto, regras de negócio, escopo do release atual.
3. Código, testes e configurações — estado implementado.
4. [`.agents/docs/`](.agents/docs/) — convenções técnicas.

Não invente requisitos, endpoints, permissões ou fluxos fora dessas fontes.

## Task-based reading

Abra **somente** o guia relacionado à tarefa:

| Tarefa | Referência |
|--------|------------|
| Produto / regra de negócio | [`docs/PRD.md`](docs/PRD.md), [`docs/escopo-negocio.md`](docs/escopo-negocio.md) |
| Arquitetura e módulos | [`.agents/docs/architecture.md`](.agents/docs/architecture.md) |
| Padrões de código (API, validação, erros) | [`.agents/docs/patterns.md`](.agents/docs/patterns.md) |
| Segurança e auth | [`.agents/docs/security.md`](.agents/docs/security.md), [`docs/agents/roles-matrix.md`](docs/agents/roles-matrix.md) |
| Persistência / Supabase | [`.agents/docs/data.md`](.agents/docs/data.md) |
| Testes | [`.agents/docs/testing.md`](.agents/docs/testing.md) |
| UI / design system | [`docs/padroes-ui.md`](docs/padroes-ui.md) |
| Contrato HTTP | [`docs/api-contract.md`](docs/api-contract.md) |
| Tracker / domínio | [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md) |
| Práticas proibidas | [`padrões/03-Praticas-Proibidas.md`](padrões/03-Praticas-Proibidas.md) |

## Regras essenciais

- **1 ticket = 1 branch = 1 PR** — não misturar módulos na mesma branch.
- Não implementar sem ticket rastreável ou fora do escopo do [`docs/PRD.md`](docs/PRD.md).
- **Monorepo:** Worker (Hono) + React (Vite) + contrato em `src/contracts/` — frontend **não** importa de `src/worker/`.
- Rotas finas; regra de negócio em repos (`src/worker/core/db/`) ou hooks (`src/react-app/hooks/`).
- Toda borda HTTP valida entrada com **Zod** (`src/schemas/`, `src/worker/schemas/`).
- Resposta API padrão: `{ success: true, data }` ou `{ success: false, error }` — ver [`docs/api-contract.md`](docs/api-contract.md).
- **Multi-tenant:** toda query de negócio filtra por `store_id`; slug via header `x-store-slug`.
- Banco em **snake_case**; código em **camelCase**; mapeamento só nos repos/mappers.
- UI burra: páginas/componentes exibem; lógica em hooks/services — ver [`padrões/03-Praticas-Proibidas.md`](padrões/03-Praticas-Proibidas.md).
- Cores e espaçamento via tokens — [`docs/padroes-ui.md`](docs/padroes-ui.md); sem hex solto em JSX novo.
- Proibido `any`, `catch` vazio, N+1 em loop, secrets no código.
- Não commitar `.env`, `.dev.vars` ou dados reais.
- Novo domínio: copiar estrutura do módulo **referência** — pedidos admin (`src/worker/routes/admin/orders.ts` + `src/react-app/hooks/admin/useAdminOrders.ts`).
- Schema/migration: SQL em `migrations/` ou `docs/supabase-*.sql` — não inventar colunas no código.
- Skills operacionais só quando o usuário pedir — não encadear `implement → to-commit → to-pr` automaticamente.

## Skills (padrão de trabalho)

Checklists em [`.agents/skills/`](.agents/skills/) — roteiros alinhados ao **modelo multi-loja** (vitrine · admin lojista · plataforma). Ver [`.agents/skills/README.md`](.agents/skills/README.md).

Rodar **somente** quando o usuário pedir:

| Skill | Padroniza |
|-------|-----------|
| `implement` | Superfície + módulo referência + regras pedido/estoque/MP |
| `to-commit` | Escopo `storefront` / `admin` / `platform` / `checkout` / … |
| `to-pr` | PR + como testar por persona |
| `code-review` | Tenant, auth por papel, integrações MP |

Não encadear `implement → to-commit → to-pr` automaticamente.

## Review e arquivos gerados

- Critérios detalhados: [`.github/REVIEW.md`](.github/REVIEW.md)
- Não editar: `dist/`, `node_modules/`, `wrangler types` gerado sem necessidade
- Ao alterar contrato HTTP: atualizar `docs/api-contract.md` e tipos em `src/contracts/`

## Validation

Comandos mínimos (= CI local):

```bash
npm run lint:check
npm run typecheck
npm run build
npm test
```

Após mudanças em API, auth ou persistência: rodar `npm test` (e `npm run test:e2e` quando existir).

Scripts operacionais (manual): `npm run fire-test:probe`, `npm run webhook-stress`.

Informe quais checks rodou e risco residual relevante.
