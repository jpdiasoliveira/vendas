# Testes

## Estado atual

| Suíte | Status | Comando |
|-------|--------|---------|
| Lint | Ativo | `npm run lint:check` |
| Typecheck | Ativo | `npm run typecheck` |
| Build | Ativo | `npm run build` |
| Unit (`*.spec.ts`) | Ativo (local + CI) | `npm test` |
| E2E (`test/e2e/*.e2e-spec.ts`) | Ativo (local + CI) | `npm run test:e2e` |

Padrão alvo: [`padrões/08-Padroes-Testes-E2E.md`](../../padrões/08-Padroes-Testes-E2E.md).

## Checks obrigatórios antes de PR

```bash
npm run lint:check
npm run typecheck
npm run build
npm test
```

Se mudou API, auth ou persistência: adicionar/rodar testes quando a suíte existir.

## Testes manuais / operacionais

| Script | Uso |
|--------|-----|
| `npm run fire-test:probe` | Sonda endpoints básicos |
| `npm run webhook-stress` | Stress de webhook MP (dev) |

Diretrizes locais: [`docs/LOCAL-TESTING-GUIDELINES.md`](../../docs/LOCAL-TESTING-GUIDELINES.md).

## Quando adicionar testes automatizados

Prioridade sugerida:

1. Utils puros (`checkoutFlowUtils`, mappers, validação Zod).
2. Repos com lógica (mocks do cliente Supabase).
3. E2E: checkout guest, login admin, criar pedido — com prefixo de fixture `e2e-test` e teardown seletivo.

## E2E (Playwright)

- Arquivos: `test/e2e/*.e2e-spec.ts` (não entram no Vitest).
- Prefixo de fixtures: `e2e-test` — e-mails via `uniqueE2eEmail()` em `test/support/e2eFixtures.ts`.
- **Nunca** `TRUNCATE` ou delete sem filtro por prefixo/id criado no teste.
- Playwright sobe `wrangler dev` (:8787) e `vite` (:5173) automaticamente (`reuseExistingServer` em dev).

### Pré-requisitos do checkout guest

1. `.dev.vars` com Supabase configurado
2. Loja `demo-store` ativa + `VITE_DEFAULT_STORE_SLUG=demo-store` em `.env.local`
3. Guest checkout habilitado (`requireLoginToCheckout: false`)
4. Pelo menos um produto ativo com estoque
5. Faixa de frete cobrindo CEP `01310-100` (admin ou seed demo)

```bash
npm run test:e2e:install   # primeira vez — Chromium
npm run test:e2e           # sobe servidores se não estiverem rodando
npm run test:e2e:ui        # modo interativo
```

### CI (GitHub Actions)

Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

| Job | Comandos |
|-----|----------|
| `check` | `lint:check`, `typecheck`, `npm test`, `build` |
| `e2e` | `playwright test` (sobe `wrangler dev` + Vite) |

**Secrets opcionais** (Settings → Secrets and variables → Actions) para E2E real na CI:

| Secret | Uso |
|--------|-----|
| `SUPABASE_URL` | Worker + Vite |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker |
| `SUPABASE_ANON_KEY` | Worker + Vite |
| `SUPABASE_JWT_SECRET` | Worker (auth admin) |

Sem secrets ou sem `demo-store` seedada: o spec de checkout faz `test.skip` — o job permanece verde.

## E2E — regras

- Prefixo fixo em fixtures: `e2e-test`, emails via helper `uniqueEmail()`.
- **Nunca** `TRUNCATE` ou delete sem filtro por prefixo/id criado no teste.
- Bootstrap do app de teste deve espelhar middlewares globais do Worker.

## Descrições

- `it('...')` em **PT-BR**; código do teste em inglês (alinhado ao restante do repo).
