# Testes

## Estado atual

| Suíte | Status | Comando |
|-------|--------|---------|
| Lint | Ativo | `npm run lint:check` |
| Typecheck | Ativo | `npm run typecheck` |
| Build | Ativo | `npm run build` |
| Unit (`*.spec.ts`) | Ativo | `npm test` |
| E2E | Em PR [#2](https://github.com/jpdiasoliveira/vendas/pull/2) | `npm run test:e2e` (após merge) |

Padrão alvo: [`padrões/08-Padroes-Testes-E2E.md`](../../padrões/08-Padroes-Testes-E2E.md).

## Checks obrigatórios antes de PR

```bash
npm run lint:check
npm run typecheck
npm run build
npm test
```

Se mudou API, auth ou persistência: adicionar/rodar testes quando a suíte existir.

## Personas RBAC (loja `demo-store`)

Usar após seed em [`docs/supabase-setup-admin-demo-store.sql`](../../docs/supabase-setup-admin-demo-store.sql) e, para equipe, convites via `/admin/loja/equipe` ou inserts em `store_members`.

| Persona | E-mail sugerido | `store_members.role` | O que validar |
|---------|-----------------|----------------------|---------------|
| **Owner** | seu e-mail no seed (`_demo_seed_owner`) | `owner` | Equipe, MP, todas as rotas admin |
| **Admin** | `admin+demo@example.com` (convite) | `admin` | Settings, histórico; **não** convida/remove equipe |
| **Staff** | `staff+demo@example.com` (convite) | `staff` | Pedidos, catálogo, frete, cupons; **403** em settings/equipe |
| **Operador** | e-mail em `PLATFORM_OPERATOR_EMAILS` | — (sem `store_members` obrigatório) | `/admin/platform/*` |
| **Cliente** | qualquer Auth sem membro na loja | — | Vitrine, `/pedidos` |
| **Guest** | sem login | — | Checkout guest, rastreio público |

Header obrigatório no admin: `x-store-slug: demo-store` + JWT Supabase em `Authorization: Bearer …`.

### Cenários manuais rápidos (RBAC)

1. **Staff** → `GET /api/admin/members` → **403**
2. **Staff** → `POST /api/admin/members` → **403**
3. **Owner** com plano `staff_members_limit = 2` e 2 membros staff/admin → `POST` → **403**
4. **Owner** → `DELETE` do próprio membro owner (único) → **403**
5. **Staff** → `/admin/loja/frete` e `/admin/loja/cupons` → **200** (UI + API)
6. **Staff** → `/admin/loja/vitrine` → tela **Acesso restrito** (após PR #5)

### E2E (quando Playwright estiver no `main`)

Roteiro sugerido em `test/e2e/admin-rbac-staff.e2e-spec.ts` (PR futuro ou empilhado no #2):

- Login staff → frete/cupons acessível
- Login staff → settings bloqueado
- Login owner → equipe acessível

Prefixo de fixtures: `e2e-test` — ver [`padrões/08-Padroes-Testes-E2E.md`](../../padrões/08-Padroes-Testes-E2E.md).

## Testes manuais / operacionais

| Script | Uso |
|--------|-----|
| `npm run fire-test:probe` | Sonda endpoints básicos |
| `npm run webhook-stress` | Stress de webhook MP (dev) |

Diretrizes locais: [`docs/LOCAL-TESTING-GUIDELINES.md`](../../docs/LOCAL-TESTING-GUIDELINES.md).

## Quando adicionar testes automatizados

Prioridade sugerida:

1. Utils puros (`checkoutFlowUtils`, mappers, validação Zod, `storeMemberRules`, `adminRole`).
2. Rotas admin com Hono `app.request` + mocks (`members.spec.ts` como referência).
3. Helpers de gate (`requireAdminOrOwner`, `requireOwner`).
4. E2E: checkout guest, login admin por papel — com prefixo de fixture `e2e-test` e teardown seletivo.

## E2E — regras

- Prefixo fixo em fixtures: `e2e-test`, emails via helper `uniqueEmail()`.
- **Nunca** `TRUNCATE` ou delete sem filtro por prefixo/id criado no teste.
- Bootstrap do app de teste deve espelhar middlewares globais do Worker.

## Descrições

- `it('...')` em **PT-BR**; código do teste em inglês (alinhado ao restante do repo).
